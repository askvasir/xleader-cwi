#!/usr/bin/env node
// Đặt group "All Users" = CHỈ XEM (read) trên các collection dùng chung.
// Sau bước này Metabase TỰ TRẢ 403 khi người dùng thường cố sửa báo cáo chung.
//   node scripts/siet-quyen-collection.mjs            # xem trước, không ghi
//   node scripts/siet-quyen-collection.mjs --apply    # ghi thật
// Bắt buộc truyền MB_USER / MB_PASS qua biến môi trường — KHÔNG hardcode credential trong file này.
import { createMetabase } from '../plugin/mcp/metabase.mjs';

const APPLY = process.argv.includes('--apply');
const BASE = process.env.MB_URL || 'http://localhost:3001';
const USER = process.env.MB_USER;
const PASS = process.env.MB_PASS;
if (!USER || !PASS) throw new Error('Thiếu MB_USER / MB_PASS trong biến môi trường');

const mb = createMetabase({ baseUrl: BASE });
await mb.login(USER, PASS);

const groups = await mb.api('/api/permissions/group');
const allUsers = groups.find((g) => g.name === 'All Users');
if (!allUsers) throw new Error('Không thấy group "All Users"');

const cols = await mb.api('/api/collection');
const chung = cols.filter((c) => c.personal_owner_id == null && c.id !== 'root' && /^XLeaders/.test(c.name));
if (!chung.length) throw new Error('Không thấy collection dùng chung nào tên bắt đầu bằng "XLeaders"');

const graph = await mb.api('/api/collection/graph');
const truoc = {};
for (const c of chung) truoc[c.id] = graph.groups[allUsers.id]?.[c.id] ?? '(không đặt)';

console.log(`Group "All Users" (id ${allUsers.id}) trên ${chung.length} collection dùng chung:`);
for (const c of chung) console.log(`  #${c.id} ${c.name}: ${truoc[c.id]} → read`);

if (!APPLY) { console.log('\n(xem trước — thêm --apply để ghi thật)'); process.exit(0); }

const moi = { ...graph.groups };
moi[allUsers.id] = { ...(moi[allUsers.id] || {}) };
for (const c of chung) moi[allUsers.id][c.id] = 'read';
await mb.api('/api/collection/graph', { method: 'PUT', body: { revision: graph.revision, groups: moi } });
console.log('✓ đã áp dụng');
