#!/usr/bin/env node
// Đặt group "All Users" = CHỈ XEM (read) trên các collection dùng chung.
// Sau bước này Metabase TỰ TRẢ 403 khi người dùng thường cố sửa báo cáo chung.
//   node scripts/siet-quyen-collection.mjs            # xem trước, không ghi
//   node scripts/siet-quyen-collection.mjs --apply    # ghi thật
// Bắt buộc truyền MB_USER / MB_PASS qua biến môi trường — KHÔNG hardcode credential trong file này.
import { createMetabase } from '../plugin/mcp/metabase.mjs';

const APPLY = process.argv.includes('--apply');
const XAC_NHAN_PROD = process.argv.includes('--toi-hieu-day-la-prod');
const BASE = process.env.MB_URL || 'http://localhost:3001';
const USER = process.env.MB_USER;
const PASS = process.env.MB_PASS;
if (!USER || !PASS) throw new Error('Thiếu MB_USER / MB_PASS trong biến môi trường');

console.log(`ĐANG NHẮM VÀO: ${BASE}`);

const LA_LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE);
// Một lần export MB_URL nhầm là đụng prod — --apply lên bất cứ đâu KHÔNG PHẢI localhost bắt buộc
// phải kèm thêm cờ xác nhận tường minh, không thì dừng lại.
if (APPLY && !LA_LOCALHOST && !XAC_NHAN_PROD) {
  throw new Error(
    `Đích "${BASE}" KHÔNG PHẢI localhost. Chạy --apply lên đây là ghi quyền THẬT lên một server không phải máy dev.\n`
    + `Nếu chắc chắn muốn vậy, thêm cờ --toi-hieu-day-la-prod vào lệnh.`,
  );
}

const mb = createMetabase({ baseUrl: BASE });
await mb.login(USER, PASS);

const groups = await mb.api('/api/permissions/group');
const allUsers = groups.find((g) => g.name === 'All Users');
if (!allUsers) throw new Error('Không thấy group "All Users"');

const cols = await mb.api('/api/collection');

// Chỉ `personal_owner_id` là CHƯA đủ: thư mục CON nằm trong personal collection có
// `personal_owner_id = null` (chỉ thư mục gốc mới mang field đó). Metabase thực tế tự loại
// personal collection khỏi graph quyền, nhưng script này sẽ chạy trên PROD với dữ liệu ta
// chưa thấy hết — tự phòng thủ tường minh, đừng dựa vào hành vi ngầm của server.
const idCaNhan = new Set(cols.filter((c) => c.personal_owner_id != null).map((c) => String(c.id)));
const laCaNhan = (c) => c.personal_owner_id != null
  || String(c.location || '').split('/').filter(Boolean).some((id) => idCaNhan.has(id));

const ngoaiCaNhan = cols.filter((c) => c.id !== 'root' && !laCaNhan(c));
const chung = ngoaiCaNhan.filter((c) => /^XLeaders/.test(c.name));
const boQua = ngoaiCaNhan.filter((c) => !/^XLeaders/.test(c.name));
if (!chung.length) throw new Error('Không thấy collection dùng chung nào tên bắt đầu bằng "XLeaders"');

const graph = await mb.api('/api/collection/graph');
const truoc = {};
for (const c of chung) truoc[c.id] = graph.groups[allUsers.id]?.[c.id] ?? '(không đặt)';

console.log(`Group "All Users" (id ${allUsers.id}) trên ${chung.length} collection dùng chung:`);
for (const c of chung) console.log(`  #${c.id} ${c.name}: ${truoc[c.id]} → read`);

// Script này KHÔNG đụng tới collection "root" (Our analytics) — đo thật trên local: "All Users" vẫn
// giữ quyền "write" ở root. Bất kỳ báo cáo/thẻ nào tạo trực tiếp ở root (không nằm trong một collection
// con) vẫn sửa được bởi mọi người dùng thường, dù script này báo "✓ đã áp dụng".
console.log(`\n⚠ Script này KHÔNG siết collection "root": đo thật trên local "All Users" vẫn có quyền "write" `
  + `ở root. Nếu có báo cáo chung nằm trực tiếp ở root (ngoài mọi thư mục con), báo cáo đó KHÔNG được bảo vệ.`);

// Bỏ sót IM LẶNG là cách guardrail chết mà không ai biết: khách đổi tên một collection ra khỏi
// tiền tố "XLeaders" là nó không còn được bảo vệ, trong khi script vẫn báo "xong".
if (boQua.length) {
  console.log(`\n⚠ ${boQua.length} collection dùng chung KHÔNG khớp tiền tố "XLeaders" nên KHÔNG được siết:`);
  for (const c of boQua) console.log(`  #${c.id} ${c.name} (đang: ${graph.groups[allUsers.id]?.[c.id] ?? '(không đặt)'})`);
  console.log('  → Nếu có báo cáo chính thức nào nằm trong danh sách này, sửa bộ lọc TRƯỚC khi --apply.');
}

if (!APPLY) { console.log('\n(xem trước — thêm --apply để ghi thật)'); process.exit(0); }

const moi = { ...graph.groups };
moi[allUsers.id] = { ...(moi[allUsers.id] || {}) };
for (const c of chung) moi[allUsers.id][c.id] = 'read';
await mb.api('/api/collection/graph', { method: 'PUT', body: { revision: graph.revision, groups: moi } });
console.log('✓ đã áp dụng');
