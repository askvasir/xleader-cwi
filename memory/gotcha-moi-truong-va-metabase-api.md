---
name: gotcha-moi-truong-va-metabase-api
description: Những thứ đã đo trên máy dev và trên Metabase API — node --test, thiếu lệnh timeout, Keychain chỉ macOS, phiên tự phục hồi, và các quirk của API Metabase
type: experience
---

## Máy dev

- **`node --test test/` HỎNG** trên Node v24.16.0 ở máy này: `Cannot find module '<repo>/test'`, kể cả trong
  thư mục sạch ngoài repo. Dùng **`node --test` trần** (tự dò `*.test.mjs`). Node in `ℹ pass N` / `ℹ fail N`,
  không phải `# pass N`.
- **Lệnh `timeout` KHÔNG tồn tại** trên máy này (macOS không có coreutils). Đừng dùng trong script/lệnh thử.
- Bootstrap bắt buộc mỗi khối bash (shell không login sẽ tụt về Node 22):
  `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24 >/dev/null`
- Đặt biến môi trường cho **chính tiến trình `node`**, không phải cho `printf` đứng trước nó trong pipe —
  `MB_URL=… printf … | node server.mjs` là **sai**, env không tới được node.

## Mật khẩu và phiên

- `savePassword` chỉ hoạt động trên **macOS** (Keychain qua lệnh `security`). Nơi khác nó **return sớm, không
  lưu gì** — plugin vẫn chạy nhờ token phiên 14 ngày, nhưng khi hết hạn sẽ báo chạy lại `/start`.
  Đặt `CWI_MB_PASSWORD` thì phiên tự gia hạn ở mọi nền tảng (`loadPassword` ưu tiên biến này trước Keychain).
- ⚠ Đừng trả lệnh `security …` cho máy Windows/Linux — lệnh đó không tồn tại, người dùng kẹt với hướng dẫn
  không dùng được. `lenhNapThuCong()` đã phân nhánh theo `process.platform`.
- `security -w <password>` để mật khẩu trong `argv` nên **`ps` nhìn thấy được vài mili-giây**. Chấp nhận: cửa
  sổ rất ngắn, chỉ lộ cục bộ, chỉ gọi lúc `/start`, và ràng buộc không-npm loại bỏ thư viện native.
- `writeFileSync(..., {mode})` **chỉ áp dụng khi TẠO MỚI**. File `session.json` có sẵn quyền `0644` sẽ giữ
  nguyên `0644` — phải `chmodSync` lại sau khi ghi.
- `connect()` bọc `mb.api`: gặp **đúng 401** thì đăng nhập lại rồi thử lại một lần. Đừng "tối ưu" thành kiểm
  `me()` một lần lúc khởi tạo — server MCP sống nhiều ngày, phiên hết giữa chừng, và lỗi 401 sẽ bay thẳng ra
  mặt người dùng. Cũng đừng bắt mọi lỗi: Metabase sập phải nổi lên nguyên trạng, không nguỵ trang thành hết hạn.

## Metabase API

- `GET /api/user` **chỉ trả user đang hoạt động**. User đã vô hiệu hoá vẫn giữ email ⇒ tạo lại sẽ lỗi
  `Email address already in use`. Dùng `?status=all` rồi `PUT /api/user/:id/reactivate`.
- Mật khẩu phải đủ độ phức tạp (`{total: 6, digit: 1}`) — chuỗi base64 ngẫu nhiên có thể **không có chữ số** và
  bị từ chối với thông điệp gây hiểu lầm `password is too common`.
- `personal_owner_id` **chỉ có trên thư mục GỐC cá nhân**; thư mục con bên trong nó có field đó `= null`.
  Muốn loại cả cây thì phải xét `location`.
- `PUT /api/collection/graph` cần đúng `revision` vừa đọc — Metabase dùng nó chống ghi đè đồng thời.
- API tạo repo/GraphQL của **GitHub** có thể trả `502` nhưng **thao tác vẫn thành công**. Kiểm lại trạng thái
  thật trước khi thử lại, đừng cho là thất bại.

## Metabase phiên bản hiện tại

`v0.62.1.7` bản **OSS** — không có sandbox, không có advanced permissions. Chỉ đăng nhập bằng mật khẩu
(mọi `enable-sso-*` đều `false`). API key **chỉ admin tạo được** (`POST /api/api-key` → `403` với user
thường) và sinh ra một user tổng hợp **không có personal collection** ⇒ không dùng được cho plugin này.
