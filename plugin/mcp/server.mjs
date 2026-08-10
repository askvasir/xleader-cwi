#!/usr/bin/env node
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRpcServer } from './rpc.mjs';
import { loadDictionary, sliceTables, findModel } from './dict.mjs';
import { makeConfigStore } from './config.mjs';
import { loadPassword } from './secrets.mjs';
import { createMetabase } from './metabase.mjs';

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
  throw new Error(`Chưa có công cụ tên "${name}".`);
}

createRpcServer({ name: 'cwi', version: '0.1.0', tools: TOOLS, onCall }).start();
