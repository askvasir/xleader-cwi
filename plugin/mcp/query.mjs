// Truy vấn CHỈ ĐỌC. Hai đường: MBQL trên Model (mặc định) và native SQL (lối thoát có kiểm soát).
// ⚠ Bảo đảm THẬT là ở tầng DB: data source insight dùng role metabase_ro chỉ có SELECT.
//    assertReadOnly() chỉ để báo lỗi sớm cho dễ hiểu.

const TU_KHOA_GHI = /\b(insert|update|delete|drop|create|alter|grant|revoke|truncate|copy|vacuum)\b/i;

/** Bỏ chuỗi và định danh trong nháy trước khi dò từ khoá → không chặn nhầm "updatedAt" hay 'đã insert'. */
export function assertReadOnly(sql) {
  const sach = String(sql).replace(/'(?:[^']|'')*'/g, "''").replace(/"(?:[^"]|"")*"/g, '""');
  if (TU_KHOA_GHI.test(sach)) {
    throw new Error('Câu lệnh này có thao tác ghi. Công cụ chỉ đọc dữ liệu, không sửa dữ liệu.');
  }
  if (sach.split(';').filter((s) => s.trim()).length > 1) {
    throw new Error('Chỉ chạy được một câu lệnh chỉ đọc mỗi lần.');
  }
}

function boc(res) {
  if (res?.status !== 'completed') {
    throw new Error(`Truy vấn lỗi: ${res?.error || res?.status || 'không rõ'}`);
  }
  return {
    cols: (res.data?.cols || []).map((c) => c.display_name || c.name),
    rows: res.data?.rows || [],
  };
}

const cacheModelId = new Map();

export async function resolveModelId(mb, collectionName, modelName) {
  const key = `${collectionName}::${modelName}`;
  if (cacheModelId.has(key)) return cacheModelId.get(key);
  const cols = await mb.api('/api/collection');
  const col = cols.find((c) => c.name === collectionName);
  if (!col) throw new Error(`Không thấy thư mục "${collectionName}" trên insight.`);
  const items = await mb.api(`/api/collection/${col.id}/items?models=dataset&models=card`);
  const it = (items.data || []).find((x) => x.name === modelName);
  if (!it) throw new Error(`Không thấy Model "${modelName}" trong thư mục "${collectionName}".`);
  cacheModelId.set(key, it.id);
  return it.id;
}

export async function runModelQuery(mb, { databaseId, modelId, aggregation, breakout, filter, limit }) {
  const query = { 'source-table': `card__${modelId}` };
  if (aggregation) query.aggregation = aggregation;
  if (breakout) query.breakout = breakout;
  if (filter) query.filter = filter;
  if (limit) query.limit = limit;
  return boc(await mb.api('/api/dataset', { method: 'POST', body: { database: databaseId, type: 'query', query } }));
}

export async function runSql(mb, { databaseId, sql }) {
  assertReadOnly(sql);
  return boc(await mb.api('/api/dataset', {
    method: 'POST', body: { database: databaseId, type: 'native', native: { query: sql } },
  }));
}
