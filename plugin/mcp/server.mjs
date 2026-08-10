#!/usr/bin/env node
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRpcServer } from './rpc.mjs';
import { loadDictionary, sliceTables, findModel } from './dict.mjs';

const DICT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'dictionary');
const dict = loadDictionary(DICT_DIR);

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
