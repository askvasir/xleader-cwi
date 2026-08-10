// Mật khẩu KHÔNG bao giờ nằm trong file plaintext.
// macOS  → Keychain qua lệnh `security`.  Nơi khác → biến môi trường CWI_MB_PASSWORD.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

const SERVICE = 'xleader-cwi';
const laMac = () => process.platform === 'darwin';

// ⚠ ĐÃ BIẾT & CHẤP NHẬN: `security` không nhận mật khẩu qua stdin, nên `-w <password>` nằm trong
// argv và LỘ trong `ps` với tiến trình cùng user cục bộ suốt vài mili-giây lệnh chạy (đã đo thật).
// Chấp nhận vì: cửa sổ rất ngắn, chỉ lộ cục bộ (không ra mạng, không ghi đĩa/log), chỉ gọi lúc
// /start, và ràng buộc "không phụ thuộc npm" loại bỏ thư viện native (keytar) — đây là lựa chọn
// tốt nhất khả dĩ. Đối chiếu: `loadPassword` (gọi thường xuyên hơn) KHÔNG hề đưa secret vào argv.
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

// ⚠ Trên macOS mật khẩu VÀO Keychain (loadPassword đọc lại được ở lần sau). Trên nơi khác KHÔNG có
// chỗ lưu bền — lệnh chỉ đặt biến môi trường CWI_MB_PASSWORD cho đúng CỬA SỔ terminal đang mở, người
// dùng phải gõ lại mỗi phiên làm việc mới. Đừng trả lệnh `security` (chỉ macOS có) cho Windows/Linux —
// đo thật: lệnh đó không tồn tại trên máy khách, người dùng kẹt với hướng dẫn không dùng được.
export function lenhNapThuCong(email) {
  if (laMac()) {
    return `read -s -p "Mật khẩu insight: " P && security add-generic-password -U -s ${SERVICE} -a "${email}" -w "$P" && unset P && echo " ✓ đã lưu"`;
  }
  if (process.platform === 'win32') {
    return `Trên PowerShell, gõ: $env:CWI_MB_PASSWORD = "<mật khẩu insight của anh/chị>"\n`
      + `(thay đúng mật khẩu vào chỗ trống — biến này chỉ tồn tại trong cửa sổ PowerShell đang mở, phải gõ lại mỗi phiên mới)`;
  }
  return `read -s -p "Mật khẩu insight: " CWI_MB_PASSWORD && export CWI_MB_PASSWORD && echo " ✓ đã đặt (chỉ áp dụng cho cửa sổ terminal đang mở, phải gõ lại mỗi phiên mới)"`;
}
