#!/usr/bin/env node
// Smoke test guardrail — chạy trên LOCAL, KHÔNG PHẢI test tự động (cần Metabase thật).
//   node scripts/smoke-guardrail.mjs
// In ra bảng: user thường tạo trong thư mục riêng (phải ĐƯỢC) vs trong collection chung (phải BỊ CHẶN).
// Bắt buộc truyền MB_USER / MB_PASS (admin) qua biến môi trường — KHÔNG hardcode credential trong file này.
import { randomBytes } from 'node:crypto';
import { createMetabase, MetabaseError } from '../plugin/mcp/metabase.mjs';

const BASE = process.env.MB_URL || 'http://localhost:3001';
console.log(`ĐANG NHẮM VÀO: ${BASE}`);

// ⚠ Script này TẠO USER THẬT. Một lần export MB_URL nhầm là tạo tài khoản trên server thật.
const LA_LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE);
if (!LA_LOCALHOST && !process.argv.includes('--toi-hieu-day-la-prod')) {
  throw new Error(
    `Đích "${BASE}" KHÔNG PHẢI localhost. Script này TẠO USER THẬT trên server đích.\n`
    + `Nếu chắc chắn muốn vậy, thêm cờ --toi-hieu-day-la-prod vào lệnh.`,
  );
}

const ADMIN = { u: process.env.MB_USER, p: process.env.MB_PASS };
if (!ADMIN.u || !ADMIN.p) throw new Error('Thiếu MB_USER / MB_PASS trong biến môi trường');

// Mật khẩu SINH NGẪU NHIÊN mỗi lần chạy. Hardcode một chuỗi cố định vào file được publish nghĩa là
// bất kỳ ai đọc repo cũng biết mật khẩu của tài khoản mà script này tạo ra.
// Tiền tố `Sm0ke!` bảo đảm đủ nhóm ký tự Metabase đòi (hoa/thường/số/ký hiệu — đo thật: thiếu số thì
// bị từ chối "password is too common"); phần đuôi ngẫu nhiên bảo đảm không đoán được.
const TEST = { u: 'cwi.smoke@xleaders.local', p: `Sm0ke!${randomBytes(12).toString('base64url')}` };

const admin = createMetabase({ baseUrl: BASE });
await admin.login(ADMIN.u, ADMIN.p);

// tạo (hoặc tái dùng) user thường. Vì mật khẩu sinh mới mỗi lần chạy, user còn sót từ lần trước
// phải được ĐẶT LẠI mật khẩu — nếu không thì đăng nhập ở dưới sẽ hỏng.
// ⚠ `?status=all` là bắt buộc: user đã VÔ HIỆU HOÁ (lần dọn dẹp trước) không xuất hiện trong danh
// sách mặc định, nhưng vẫn giữ email ⇒ nhánh tạo mới sẽ lỗi "Email address already in use".
const ds = await admin.api('/api/user?status=all');
let u = (ds.data || ds).find((x) => x.email === TEST.u);
if (u) {
  if (u.is_active === false) await admin.api(`/api/user/${u.id}/reactivate`, { method: 'PUT' });
  await admin.api(`/api/user/${u.id}/password`, { method: 'PUT', body: { password: TEST.p } });
} else {
  u = await admin.api('/api/user', { method: 'POST', body: {
    first_name: 'CWI', last_name: 'Smoke', email: TEST.u, password: TEST.p } });
}

const user = createMetabase({ baseUrl: BASE });
await user.login(TEST.u, TEST.p);
const me = await user.me();

const cols = await admin.api('/api/collection');
const chung = cols.find((c) => c.name === 'XLeaders – Models');
if (!chung) throw new Error(`Không thấy collection "XLeaders – Models" trên ${BASE} — kiểm lại MB_URL.`);

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
