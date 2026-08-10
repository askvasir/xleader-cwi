#!/usr/bin/env node
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRpcServer } from './rpc.mjs';
import { loadDictionary, sliceTables, findModel, compareFingerprint } from './dict.mjs';
import { makeConfigStore } from './config.mjs';
import { loadPassword, savePassword, lenhNapThuCong } from './secrets.mjs';
import { createMetabase } from './metabase.mjs';
import { resolveModelId, runModelQuery, runSql } from './query.mjs';
import { getEntity, listMine, createCard, updateCard, createDashboard, putDashcards, archive } from './report.mjs';
import { isMine } from './guard.mjs';

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

/** Đọc cấu trúc THẬT trên DB để so vân tay. Hai truy vấn (cột + giá trị enum), không lấy dữ liệu kinh doanh. */
export async function docCauTrucThat(mb) {
  const cfg = await getConfig();
  const res = await mb.api('/api/dataset', {
    method: 'POST',
    body: { database: cfg.databaseId, type: 'native', native: { query:
      `select table_name, column_name from information_schema.columns where table_schema = '${cfg.ws}'` } },
  });
  if (res?.status !== 'completed') throw new Error(`Không đọc được cấu trúc dữ liệu: ${res?.error || res?.status}`);
  const tables = {};
  for (const [t, c] of res.data.rows) (tables[t] ||= []).push(c);

  // Giá trị enum THẬT: khoá của fingerprint.enums là "<bảng>.<cột>", nhưng pg_enum chỉ biết type OID —
  // phải bắc cầu qua information_schema.columns.udt_name (= tên type) để quy về đúng bảng.cột.
  // ⚠ Cột MULTI_SELECT là MẢNG: `udt_name` trỏ vào type MẢNG (`ct.typcategory = 'A'`), không phải type
  // enum gốc — phải theo `typelem` để lấy type PHẦN TỬ rồi mới join pg_enum. ĐỪNG tự bỏ tiền tố "_" bằng
  // tay: bảng object tuỳ chỉnh có tiền tố "_" (vd "_class") nên type enum GỐC của nó vốn dĩ ĐÃ bắt đầu
  // bằng "_" (vd "_class_trangThai_enum") — bỏ nhầm một dấu "_" làm mất luôn enum của MỌI bảng "_*"
  // (đo thật khi sửa: 15 cột enumLech giả trên các bảng "_class", "_order", "_enrollment"…).
  const resEnum = await mb.api('/api/dataset', {
    method: 'POST',
    body: { database: cfg.databaseId, type: 'native', native: { query:
      `select c.table_name, c.column_name, e.enumlabel
       from information_schema.columns c
       join pg_type ct on ct.typname = c.udt_name
       join pg_type bt on bt.oid = case when ct.typcategory = 'A' then ct.typelem else ct.oid end
       join pg_enum e on e.enumtypid = bt.oid
       where c.table_schema = '${cfg.ws}'` } },
  });
  if (resEnum?.status !== 'completed') throw new Error(`Không đọc được giá trị enum: ${resEnum?.error || resEnum?.status}`);
  const enums = {};
  for (const [t, c, v] of resEnum.data.rows) (enums[`${t}.${c}`] ||= []).push(v);

  return { tables, enums };
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
      'chỉ dùng mode "sql" khi Model không làm được (tỉ lệ giữa các dòng, YoY, kỳ gộp). ' +
      'mode "sql": MỌI bảng phải ghi đủ "<schema>"."<bảng>" — KHÔNG được viết tên bảng trần (vd "_class" một mình ' +
      'sẽ báo lỗi "relation does not exist"). Tên schema hiện tại lấy bằng cwi_dict {list:true} (khoá "schema").',
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
        action: { type: 'string', enum: ['list', 'get', 'create_card', 'update_card', 'create_dashboard', 'put_dashcards', 'archive'] },
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
  {
    name: 'cwi_setup',
    description: 'Thiết lập lần đầu: đăng nhập insight và tạo thư mục báo cáo riêng. Chỉ lệnh /start dùng tool này.',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Chỉ cần khi máy không hiện được ô nhập liệu (đường dự phòng).' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'cwi_health',
    description: 'Kiểm tra kết nối, quyền, và xem từ điển còn khớp cấu trúc dữ liệu thật không.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

async function onCall(name, args, ctxRpc) {
  if (name === 'cwi_ping') return 'cwi sẵn sàng';
  if (name === 'cwi_dict') {
    if (args.list) {
      return JSON.stringify({
        schema: MB_WS,
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
      // 'get' KHÔNG qua guard — đọc là tự do, xem spec §5. Cần cho luồng "tạo bản sao báo cáo chung".
      case 'get': return JSON.stringify(await getEntity(mb, { kind: args.kind || 'card', id: args.id }), null, 1);
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
  if (name === 'cwi_setup') {
    // Đường CHÍNH: xin email + mật khẩu qua form native ⇒ mật khẩu KHÔNG đi vào nội dung hội thoại.
    // Đường DỰ PHÒNG (tự động, khi client không hỗ trợ form): đọc mật khẩu từ Keychain / biến môi trường,
    // chưa có thì trả về lệnh để người dùng dán vào Terminal — vẫn không để mật khẩu qua hội thoại.
    let email = args.email;
    let password;
    try {
      const r = await ctxRpc.request('elicitation/create', {
        mode: 'form',
        message: 'Đăng nhập insight.xteam.edu.vn',
        requestedSchema: {
          type: 'object',
          properties: {
            email: { type: 'string', title: 'Email insight' },
            password: { type: 'string', title: 'Mật khẩu', format: 'password' },
          },
          required: ['email', 'password'],
        },
      });
      if (r?.action !== 'accept') return 'Anh/chị đã huỷ. Khi nào cần thì gõ /start lại nhé.';
      ({ email, password } = r.content);
    } catch {
      if (!email) {
        return 'Máy này chưa hiện được ô nhập liệu. Anh/chị cho em biết email đăng nhập insight để em hướng dẫn tiếp nhé.';
      }
      password = await loadPassword(email);
      if (!password) {
        return `Máy này chưa hiện được ô nhập liệu, nên mình làm cách khác cho an toàn nhé.\n\n`
          + `Anh/chị mở Terminal (hoặc PowerShell), làm theo hướng dẫn dưới đây:\n\n`
          + `${lenhNapThuCong(email)}\n\nXong rồi gõ /start lại giúp em.`;
      }
    }
    const mb = createMetabase({ baseUrl: MB_URL });
    try { await mb.login(email, password); }
    catch { throw new Error('Email hoặc mật khẩu chưa đúng. Anh/chị thử đăng nhập ở insight.xteam.edu.vn xem sao nhé.'); }
    const me = await mb.me();
    if (!me.personal_collection_id) {
      throw new Error('Tài khoản này chưa có thư mục cá nhân trên insight — nhờ quản trị kiểm tra giúp.');
    }
    // Tạo (hoặc tìm lại) thư mục riêng — idempotent theo tên, chạy /start lần hai không tạo trùng.
    const ten = `Báo cáo của ${me.common_name || email}`;
    const all = await mb.api('/api/collection');
    // Dùng lại `isMine` của guard.mjs thay vì chép logic tách `location` — chính hàm đó được viết
    // và có test riêng để tránh ca "1080 dính vào 108". Chép tay lần hai là mời lỗi đó quay lại.
    const daCo = all.find((c) => c.name === ten && isMine(c, me.personal_collection_id));
    const thuMuc = daCo || await mb.api('/api/collection', {
      method: 'POST', body: { name: ten, parent_id: me.personal_collection_id } });
    await savePassword(email, password);
    await store.writeSession(mb.getSession());
    await store.writeConfig({
      email, myUserId: me.id, personalCollectionId: me.personal_collection_id,
      cwiCollectionId: thuMuc.id, thuMucTen: ten,
    });
    setClient(mb);
    // ⚠ Trên macOS mật khẩu vào Keychain (đọc lại được ở phiên sau). Nơi khác KHÔNG có chỗ lưu bền —
    // đừng nói "đã lưu vào biến môi trường" khi chưa ai đặt biến đó; nói THẲNG là chưa lưu được.
    return JSON.stringify({
      ten_nguoi_dung: me.common_name, thu_muc: ten,
      da_luu_mat_khau: process.platform === 'darwin' ? 'Keychain' : false,
      ghi_chu: process.platform === 'darwin' ? null
        : 'Máy này CHƯA lưu được mật khẩu (chỉ macOS tự lưu vào Keychain). Anh/chị cần tự đặt biến môi trường '
          + 'CWI_MB_PASSWORD mỗi khi mở phiên làm việc mới, xem hướng dẫn ở "lenh_nap_thu_cong".',
      lenh_nap_thu_cong: process.platform === 'darwin' ? null : lenhNapThuCong(email),
    }, null, 1);
  }
  if (name === 'cwi_health') {
    const cfg = await getConfig();
    let mb;
    try { mb = await connect(); }
    catch (e) { return JSON.stringify({ da_cau_hinh: false, thong_bao: e.message }, null, 1); }
    const ket = { da_cau_hinh: true, ket_noi: 'ok' };
    // boQuaCache: health phải HỎI LẠI Metabase mỗi lần, nếu không nó chỉ báo lại kết quả lần đầu.
    try { await resolveModelId(mb, cfg.modelsCollection, 'Cơ hội (Lead)', { boQuaCache: true }); ket.xem_duoc_model = true; }
    catch (e) { ket.xem_duoc_model = false; ket.model_loi = e.message; }
    try { await runSql(mb, { databaseId: cfg.databaseId, sql: 'select 1' }); ket.chay_duoc_sql = true; }
    catch (e) { ket.chay_duoc_sql = false; ket.sql_loi = e.message; }
    try {
      const ss = compareFingerprint(
        { tables: dict.fingerprint.tables, enums: dict.fingerprint.enums },
        await docCauTrucThat(mb),
      );
      ket.tu_dien_khop = ss.ok;
      if (!ss.ok) {
        ket.cot_thieu = ss.thieuCot.slice(0, 20);
        if (ss.enumLech.length) ket.enum_lech = ss.enumLech.slice(0, 20);
      }
    } catch (e) { ket.tu_dien_khop = null; ket.tu_dien_loi = e.message; }
    return JSON.stringify(ket, null, 1);
  }
  throw new Error(`Chưa có công cụ tên "${name}".`);
}

// Chỉ khởi động server stdio khi file này được CHẠY TRỰC TIẾP (`node server.mjs`, đúng như
// plugin/.mcp.json gọi) — KHÔNG khi bị import (test import docCauTrucThat để kiểm I4 sẽ tự nhiên
// mở một readline trên stdin, treo `node --test` vô thời hạn nếu thiếu chốt này).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createRpcServer({ name: 'cwi', version: '0.1.0', tools: TOOLS, onCall }).start();
}
