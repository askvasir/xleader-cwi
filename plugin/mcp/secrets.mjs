// Mật khẩu KHÔNG bao giờ nằm trong file plaintext.
// macOS  → Keychain qua lệnh `security`.  Nơi khác → biến môi trường CWI_MB_PASSWORD.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

const SERVICE = 'xleader-cwi';
const laMac = () => process.platform === 'darwin';

export async function savePassword(email, password) {
  if (!laMac()) return;                       // nơi khác: người dùng tự đặt biến môi trường
  await run('security', ['add-generic-password', '-U', '-s', SERVICE, '-a', email, '-w', password]);
}

export async function loadPassword(email) {
  if (process.env.CWI_MB_PASSWORD) return process.env.CWI_MB_PASSWORD;
  if (!laMac()) return null;
  try {
    const { stdout } = await run('security', ['find-generic-password', '-s', SERVICE, '-a', email, '-w']);
    return stdout.replace(/\n$/, '');
  } catch { return null; }
}

export function lenhNapThuCong(email) {
  return `read -s -p "Mật khẩu insight: " P && security add-generic-password -U -s ${SERVICE} -a "${email}" -w "$P" && unset P && echo " ✓ đã lưu"`;
}
