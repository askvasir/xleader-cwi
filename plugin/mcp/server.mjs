#!/usr/bin/env node
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRpcServer } from './rpc.mjs';
import { loadDictionary, sliceTables, findModel } from './dict.mjs';
import { makeConfigStore } from './config.mjs';
import { loadPassword } from './secrets.mjs';
import { createMetabase } from './metabase.mjs';
import { resolveModelId, runModelQuery, runSql } from './query.mjs';
import { listMine, createCard, updateCard, createDashboard, putDashcards, archive } from './report.mjs';

const DICT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'dictionary');
const dict = loadDictionary(DICT_DIR);

const MB_URL = process.env.MB_URL || 'https://insight.xteam.edu.vn';
const MB_DB = Number(process.env.MB_DB || 2);
const MB_WS = process.env.MB_WS || 'workspace_6ytci89jf3kflsl9aaaxrr5hw';
const MODELS_COLLECTION = 'XLeaders – Models';
const store = makeConfigStore();

export const getConfig = async () => ({
  baseUrl: MB_URL, databaseId: MB_DB, ws: MB_WS, modelsCollection: MODELS_COLLECTION,
});

let _mb = null;

async function dangNhapLai(mb, email) {
  const pw = await loadPassword(email);
  if (!pw) throw new Error('Không đọc được mật khẩu đã lưu. Anh/chị chạy lại /start giúp em nhé.');
  await store.writeSession(await mb.login(email, pw));
}

/**
 * Trả client đã đăng nhập, tự phục hồi phiên khi hết hạn.
 *
 * ⚠⚠ ĐỪNG "tối ưu" thành `if (_mb) return _mb` rồi thăm dò bằng `me()` MỘT LẦN lúc tạo:
 * server MCP sống rất lâu (nhiều ngày), phiên Metabase thì hết hạn giữa chừng. Kiểm một lần
 * lúc khởi tạo nghĩa là mọi lời gọi sau đó ném thẳng lỗi 401 tiếng Anh ra mặt người dùng.
 * Cũng đừng gọi `me()` trước MỖI lời gọi — thêm một vòng mạng cho mỗi câu hỏi.
 * Cách đúng: BỌC `api()`, gặp ĐÚNG 401 thì đăng nhập lại một lần rồi thử lại.
 * Chỉ 401 mới là "hết hạn"; Metabase sập / mạng lỗi phải nổi lên nguyên trạng, không được
 * nguỵ trang thành hết hạn rồi đăng nhập lại vô ích.
 */
export async function connect() {
  const cfg = await store.readConfig();
  if (!cfg) throw new Error('Chưa cấu hình. Anh/chị gõ /start để em thiết lập giúp nhé.');
  if (_mb) return _mb;
  const mb = createMetabase({ baseUrl: MB_URL });
  const token = await store.readSession();
  if (token) mb.setSession(token);
  else await dangNhapLai(mb, cfg.email);

  const goc = mb.api;
  mb.api = async (path, opts) => {
    try {
      return await goc(path, opts);
    } catch (e) {
      if (e?.status !== 401) throw e;      // KHÔNG nuốt lỗi thật
      await dangNhapLai(mb, cfg.email);
      return goc(path, opts);              // thử lại đúng MỘT lần
    }
  };
  _mb = mb;
  return mb;
}

/** Đặt lại client sau khi /start đăng nhập mới — Task 10 dùng. */
export function setClient(mb) { _mb = mb; }

export async function getCtx() {
  const cfg = await store.readConfig();
  if (!cfg) throw new Error('Chưa cấu hình. Anh/chị gõ /start để em thiết lập giúp nhé.');
  return {
    myUserId: cfg.myUserId,
    personalCollectionId: cfg.personalCollectionId,
    cwiCollectionId: cfg.cwiCollectionId,
  };
}

const TOOLS = [
  {
    name: 'cwi_ping',
    description: 'Kiểm tra plugin xleader-cwi đã nạp được chưa.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'cwi_dict',
    description: 'Tra từ điển dữ liệu XLeaders theo LÁT CẮT. Chỉ xin đúng bảng/model cần dùng — đừng xin tất cả.',
    inputSchema: {
      type: 'object',
      properties: {
        tables: { type: 'array', items: { type: 'string' }, description: 'Tên bảng SQL, vd ["_orderItem","_class"]' },
        model: { type: 'string', description: 'Tên Model, vd "Ghi danh (HV theo lớp)"' },
        list: { type: 'boolean', description: 'true = liệt kê tên mọi bảng và model (rẻ, dùng để định hướng)' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'cwi_query',
    description: 'Chạy truy vấn CHỈ ĐỌC trên insight. Ưu tiên mode "model" (định nghĩa nghiệp vụ đã đối soát sẵn); ' +
      'chỉ dùng mode "sql" khi Model không làm được (tỉ lệ giữa các dòng, YoY, kỳ gộp).',
    inputSchema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['model', 'sql'] },
        model: { type: 'string', description: 'Tên Model khi mode=model' },
        aggregation: { type: 'array', description: 'MBQL aggregation, vd [["count"]]' },
        breakout: { type: 'array', description: 'MBQL breakout' },
        filter: { type: 'array', description: 'MBQL filter' },
        limit: { type: 'number' },
        sql: { type: 'string', description: 'Câu SELECT khi mode=sql' },
      },
      required: ['mode'],
      additionalProperties: false,
    },
  },
  {
    name: 'cwi_report',
    description: 'Xem/tạo/sửa báo cáo CỦA CHÍNH NGƯỜI DÙNG trong thư mục riêng. ' +
      'Không bao giờ đụng được báo cáo chung của công ty.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'create_card', 'update_card', 'create_dashboard', 'put_dashcards', 'archive'] },
        id: { type: 'number' },
        kind: { type: 'string', enum: ['card', 'dashboard'] },
        name: { type: 'string' },
        display: { type: 'string', description: 'scalar | table | bar | line | funnel' },
        dataset_query: { type: 'object' },
        visualization_settings: { type: 'object' },
        patch: { type: 'object' },
        dashboard_id: { type: 'number' },
        dashcards: { type: 'array' },
        tabs: { type: 'array' },
        parameters: { type: 'array' },
      },
      required: ['action'],
      additionalProperties: false,
    },
  },
];

async function onCall(name, args) {
  if (name === 'cwi_ping') return 'cwi sẵn sàng';
  if (name === 'cwi_dict') {
    if (args.list) {
      return JSON.stringify({
        bang: Object.keys(dict.schema.tables),
        model: dict.models.models.map((m) => m.name),
      }, null, 1);
    }
    const out = {};
    const GOI_Y = 'Dùng cwi_dict {list:true} để xem danh sách bảng.';
    if (args.tables?.length) {
      const r = sliceTables(dict.schema, args.tables);
      // Không tìm thấy bảng NÀO ⇒ báo lỗi hẳn. Trả `{tables:{}}` im lặng là ngõ cụt:
      // người hỏi không biết tên bảng, và tool "thành công" nên không ai biết là đã hỏng.
      if (!Object.keys(r.tables).length) {
        throw new Error(`Không có bảng nào tên ${r.thieu.map((t) => `"${t}"`).join(', ')}. ${GOI_Y}`);
      }
      out.tables = r.tables;
      if (r.thieu.length) out.khongTimThay = { ten: r.thieu, goiY: GOI_Y };
    }
    if (args.model) {
      const m = findModel(dict.models, args.model);
      if (!m) throw new Error(`Không có Model tên "${args.model}". Dùng cwi_dict {list:true} để xem danh sách.`);
      out.model = m;
    }
    if (!out.tables && !out.model) throw new Error('Cần truyền tables[], model, hoặc list:true.');
    return JSON.stringify(out, null, 1);
  }
  if (name === 'cwi_query') {
    // ⚠ `rpc.mjs` KHÔNG kiểm `inputSchema` — `required` chỉ là mô tả cho model AI đọc, server không ép.
    // Không tự kiểm ở đây thì thiếu `sql` lộ lỗi Clojure nội bộ của Metabase bằng tiếng Anh
    // ("Assert failed: (string? sql)"), còn thiếu `model` thì báo 'không thấy Model "undefined"'
    // — đọc như người dùng gõ sai tên, chứ không phải quên tham số. Cả hai đã đo thật.
    if (args.mode !== 'model' && args.mode !== 'sql') {
      throw new Error(`Cách truy vấn không hợp lệ: "${args.mode}". Chỉ nhận "model" hoặc "sql".`);
    }
    if (args.mode === 'sql' && !String(args.sql || '').trim()) {
      throw new Error('Thiếu câu truy vấn. Dùng mode "sql" thì phải kèm tham số `sql`.');
    }
    if (args.mode === 'model' && !String(args.model || '').trim()) {
      throw new Error('Thiếu tên Model. Gọi cwi_dict {list:true} để xem danh sách Model có sẵn.');
    }
    const mb = await connect();                 // connect()/getConfig() từ Task 7
    const cfg = await getConfig();
    if (args.mode === 'sql') {
      return JSON.stringify(await runSql(mb, { databaseId: cfg.databaseId, sql: args.sql }), null, 1);
    }
    const modelId = await resolveModelId(mb, cfg.modelsCollection, args.model);
    return JSON.stringify(await runModelQuery(mb, {
      databaseId: cfg.databaseId, modelId,
      aggregation: args.aggregation, breakout: args.breakout, filter: args.filter, limit: args.limit,
    }), null, 1);
  }
  if (name === 'cwi_report') {
    const mb = await connect();
    const ctx = await getCtx();               // getCtx() từ Task 7
    switch (args.action) {
      case 'list': return JSON.stringify(await listMine(mb, ctx), null, 1);
      case 'create_card': return JSON.stringify(await createCard(mb, ctx, {
        name: args.name, collectionId: ctx.cwiCollectionId, display: args.display,
        datasetQuery: args.dataset_query, visualizationSettings: args.visualization_settings }), null, 1);
      case 'update_card': return JSON.stringify(await updateCard(mb, ctx, { id: args.id, patch: args.patch }), null, 1);
      case 'create_dashboard': return JSON.stringify(await createDashboard(mb, ctx, {
        name: args.name, collectionId: ctx.cwiCollectionId }), null, 1);
      case 'put_dashcards': return JSON.stringify(await putDashcards(mb, ctx, {
        dashboardId: args.dashboard_id, dashcards: args.dashcards, tabs: args.tabs, parameters: args.parameters }), null, 1);
      case 'archive': return JSON.stringify(await archive(mb, ctx, { kind: args.kind, id: args.id }), null, 1);
      default: throw new Error(`Hành động lạ: ${args.action}`);
    }
  }
  throw new Error(`Chưa có công cụ tên "${name}".`);
}

createRpcServer({ name: 'cwi', version: '0.1.0', tools: TOOLS, onCall }).start();
