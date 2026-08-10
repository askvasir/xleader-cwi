// Nạp + CẮT LÁT từ điển. Mục tiêu: không bao giờ trả cả từ điển vào context của model.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function loadDictionary(dir) {
  const read = (f) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
  return { schema: read('schema.json'), models: read('models.json'), fingerprint: read('fingerprint.json') };
}

export function sliceTables(schema, names) {
  const tables = {}, thieu = [];
  for (const n of names) (schema.tables[n] ? (tables[n] = schema.tables[n]) : thieu.push(n));
  return { tables, thieu };
}

export function findModel(models, name) {
  return (models.models || []).find((m) => m.name === name) || null;
}

/** So vân tay đã ship với cấu trúc THẬT trên DB. Cột/giá trị THÊM = an toàn; MẤT hoặc ĐỔI = lệch. */
export function compareFingerprint(fingerprint, live) {
  const thieuCot = [], enumLech = [];
  for (const [t, cols] of Object.entries(fingerprint.tables || {})) {
    const có = new Set(live.tables?.[t] || []);
    for (const c of cols) if (!có.has(c)) thieuCot.push(`${t}.${c}`);
  }
  for (const [k, vals] of Object.entries(fingerprint.enums || {})) {
    const có = new Set(live.enums?.[k] || []);
    if (vals.some((v) => !có.has(v))) enumLech.push(k);
  }
  return { ok: thieuCot.length === 0 && enumLech.length === 0, thieuCot, enumLech };
}
