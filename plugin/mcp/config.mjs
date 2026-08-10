import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const CONFIG_DIR = join(homedir(), '.xleader-cwi');

export function makeConfigStore(dir = CONFIG_DIR) {
  const doc = (f) => join(dir, f);
  const docJson = (f) => { try { return JSON.parse(readFileSync(doc(f), 'utf8')); } catch { return null; } };
  const taoThuMuc = () => mkdirSync(dir, { recursive: true, mode: 0o700 });
  return {
    dir,
    async readConfig() { return docJson('config.json'); },
    async writeConfig(obj) {
      taoThuMuc();
      writeFileSync(doc('config.json'), JSON.stringify(obj, null, 2) + '\n');
    },
    async readSession() { return docJson('session.json')?.session ?? null; },
    async writeSession(token) {
      taoThuMuc();
      const f = doc('session.json');
      writeFileSync(f, JSON.stringify({ session: token }) + '\n', { mode: 0o600 });
      // ⚠ `mode` của writeFileSync CHỈ áp dụng khi file được TẠO MỚI. File đã tồn tại với quyền
      // lỏng (khôi phục từ backup, MDM đặt sẵn…) sẽ GIỮ NGUYÊN quyền cũ ⇒ token phiên, vốn tương
      // đương thông tin đăng nhập sống, đọc được bởi user khác trên máy. Phải chmod lại cho chắc.
      chmodSync(f, 0o600);
    },
  };
}
