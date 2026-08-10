#!/usr/bin/env node
// Smoke test guardrail — chạy trên LOCAL, KHÔNG PHẢI test tự động (cần Metabase thật).
//   node scripts/smoke-guardrail.mjs
// In ra bảng: user thường tạo trong thư mục riêng (phải ĐƯỢC) vs trong collection chung (phải BỊ CHẶN).
// Bắt buộc truyền MB_USER / MB_PASS (admin) qua biến môi trường — KHÔNG hardcode credential trong file này.
import { createMetabase, MetabaseError } from '../plugin/mcp/metabase.mjs';

const BASE = process.env.MB_URL || 'http://localhost:3001';
const ADMIN = { u: process.env.MB_USER, p: process.env.MB_PASS };
if (!ADMIN.u || !ADMIN.p) throw new Error('Thiếu MB_USER / MB_PASS trong biến môi trường');
const TEST = { u: 'cwi.smoke@xleaders.local', p: 'CwiSmoke2026!' };

const admin = createMetabase({ baseUrl: BASE });
await admin.login(ADMIN.u, ADMIN.p);

// tạo (hoặc tái dùng) user thường
const ds = await admin.api('/api/user');
let u = (ds.data || ds).find((x) => x.email === TEST.u);
if (!u) u = await admin.api('/api/user', { method: 'POST', body: {
  first_name: 'CWI', last_name: 'Smoke', email: TEST.u, password: TEST.p } });

const user = createMetabase({ baseUrl: BASE });
await user.login(TEST.u, TEST.p);
const me = await user.me();

const cols = await admin.api('/api/collection');
const chung = cols.find((c) => c.name === 'XLeaders – Models');

async function thu(nhan, fn) {
  try { await fn(); console.log(`  ${nhan}: ĐƯỢC (200)`); return 'ĐƯỢC'; }
  catch (e) { console.log(`  ${nhan}: BỊ CHẶN (${e instanceof MetabaseError ? e.status : '?'})`); return 'CHẶN'; }
}

console.log(`User thường #${me.id}, thư mục cá nhân #${me.personal_collection_id}`);
const a = await thu('tạo trong thư mục CÁ NHÂN  ', () =>
  user.api('/api/collection', { method: 'POST', body: { name: 'smoke-ca-nhan', parent_id: me.personal_collection_id } }));
const b = await thu('tạo trong collection CHUNG ', () =>
  user.api('/api/collection', { method: 'POST', body: { name: 'smoke-chung', parent_id: chung.id } }));

console.log(`\nKẾT LUẬN: cá nhân=${a} · chung=${b}`);
console.log(b === 'CHẶN' ? '✓ Guardrail lớp 1 ĐANG HOẠT ĐỘNG' : '✗ CHƯA siết quyền — chạy scripts/siet-quyen-collection.mjs --apply');
