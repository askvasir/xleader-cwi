# xleader-cwi — Claude Operating Manual

Plugin Claude Code "Chat With Insight": nhân viên XLeaders (Sale, kế toán, sếp — **không biết code, không biết
SQL**) hỏi dữ liệu kinh doanh và tự dựng dashboard trên Metabase `insight.xteam.edu.vn`.

## Đầu mỗi phiên, theo thứ tự

1. **Đọc `memory/MEMORY.md`** (chỉ mục). Mở thêm đúng file mà nhiệm vụ cần — **đừng đọc cả memory**.
2. Bootstrap shell, dán vào đầu MỖI khối `Bash` (shell không login sẽ tụt về Node 22):
   ```bash
   export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24 >/dev/null
   cd ~/project/xleader-cwi
   ```

## Ngôn ngữ

**Tiếng Việt** cho mọi thứ người dùng đọc: mô tả tool, thông điệp lỗi, nội dung skill, `/start`, README.
Tên kỹ thuật (hàm, biến, tool id) giữ tiếng Anh/snake_case.

## Vòng lặp

```
sửa code → node --test (TRẦN, không phải `node --test test/`) → thử tool qua stdio → commit
```

## RÀNG BUỘC — đọc lại trước khi sửa code

1. **KHÔNG thêm dependency npm.** Plugin phân phối qua git marketplace, máy người dùng không chạy
   `npm install`. `plugin/mcp/*.mjs` chỉ được import thư viện chuẩn Node.
2. **`report.mjs` là đường GHI DUY NHẤT** và mọi hàm ghi phải gọi guard **TRƯỚC** khi chạm API. Không có
   `DELETE` ở đâu — gỡ báo cáo = `archived:true`. → [[guardrail-hai-lop]]
3. **`rpc.mjs` KHÔNG ép `inputSchema`** — mọi tool tự validate tham số, đặt TRƯỚC `connect()`.
   → [[gotcha-rpc-khong-ep-tham-so]]
4. **Mọi SQL phải ghi đủ `"<schema>"."<bảng>"`.** → [[gotcha-sql-phai-ghi-schema]]
5. **KHÔNG hardcode thông tin đăng nhập**, kể cả làm giá trị mặc định — các file này được publish.
6. Bump version ở **CẢ HAI** manifest (`.claude-plugin/marketplace.json` + `plugin/.claude-plugin/plugin.json`)
   thì auto-update mới nhận.

## Chạm vào Metabase

- **Mặc định trong code trỏ PROD.** Khi thử phải export `MB_URL=http://localhost:3001` và
  `MB_WS=workspace_1wgvd1injqtife6y4rvfbu3h5`, và đặt env cho **chính tiến trình `node`**.
- **Prod là hệ thống LIVE đang điều hành công ty khách** (6 dashboard chính thức). Mọi thao tác GHI lên prod —
  siết quyền collection, tạo user, dựng báo cáo — **phải hỏi người dùng trước, mỗi lần**.
- `scripts/smoke-guardrail.mjs` **tạo user thật**; `scripts/siet-quyen-collection.mjs --apply` **ghi quyền
  thật**. Cả hai bắt buộc cờ `--toi-hieu-day-la-prod` khi đích không phải localhost.

## Số liệu

**SQL chạy được ≠ số đúng.** Mọi lỗi số liệu thật của hệ sinh thái này đều đi qua các cổng kiểm "có chạy
không" một cách sạch sẽ. Trước khi nói một con số là đúng, đếm lại bằng **một đường độc lập**.
→ [[recipe-doi-soat-so-lieu]]

## Working Memory Protocol

Cuối mỗi nhiệm vụ đáng kể, tự cập nhật `memory/` — KHÔNG hỏi: sửa memory đã chứng minh là sai, thêm memory cho
**sự thật hiện tại không hiển nhiên** (quirk API, ID thật, recipe khó tìm lại), cập nhật chỉ mục nếu có file
mới. **Thuộc về memory:** trạng thái hiện tại bền vững. **Không thuộc:** lịch sử, tường thuật gỡ lỗi, hay thứ
đã nằm trong code / `git log`.
