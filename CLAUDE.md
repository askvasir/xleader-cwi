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
sửa skill/knowledge → thử tool qua MCP `insight` (vd `execute_sql`) → commit
```

## RÀNG BUỘC — đọc lại trước khi sửa code

1. **KHÔNG thêm mã nguồn hay dependency ngoài kho chuẩn.** Plugin phân phối qua git marketplace, máy
   người dùng không tự cài gói qua npm. Từ v0.2 plugin chỉ còn skill/knowledge dạng Markdown gọi thẳng MCP
   gốc của Metabase — không còn thư mục mã nguồn nào trong plugin để thêm dependency vào.
2. **Mọi SQL phải ghi đủ `"<schema>"."<bảng>"` và lọc `"deletedAt" is null`** trên mọi bảng tham gia câu
   lệnh. → [[gotcha-sql-phai-ghi-schema]]
3. **Không đóng gói snapshot cấu trúc dữ liệu vào repo** — cấu trúc đọc SỐNG bằng `information_schema` mỗi
   lần cần, không cache thành file trong plugin.
4. **KHÔNG hardcode thông tin đăng nhập**, kể cả làm giá trị mặc định — các file này được publish.
5. Bump version ở **CẢ HAI** manifest (`.claude-plugin/marketplace.json` + `plugin/.claude-plugin/plugin.json`)
   thì auto-update mới nhận.

## Chạm vào Metabase

- **Server `insight` khai trong `plugin/.mcp.json` trỏ thẳng PROD** (`insight.xteam.edu.vn`) — không còn cờ
  đổi đích trong plugin nữa. Muốn thử trên một server Metabase khác (vd local) thì tự thêm/đổi server MCP
  qua `/mcp` cho phiên đang làm việc, không sửa `.mcp.json` của plugin.
- **Prod là hệ thống LIVE đang điều hành công ty khách** (6 dashboard chính thức). Mọi thao tác GHI lên prod
  — tạo user, siết quyền collection, dựng/sửa báo cáo — **phải hỏi người dùng trước, mỗi lần**.

## Số liệu

**SQL chạy được ≠ số đúng.** Mọi lỗi số liệu thật của hệ sinh thái này đều đi qua các cổng kiểm "có chạy
không" một cách sạch sẽ. Trước khi nói một con số là đúng, đếm lại bằng **một đường độc lập**.
→ [[recipe-doi-soat-so-lieu]]

## Working Memory Protocol

Cuối mỗi nhiệm vụ đáng kể, tự cập nhật `memory/` — KHÔNG hỏi: sửa memory đã chứng minh là sai, thêm memory cho
**sự thật hiện tại không hiển nhiên** (quirk API, ID thật, recipe khó tìm lại), cập nhật chỉ mục nếu có file
mới. **Thuộc về memory:** trạng thái hiện tại bền vững. **Không thuộc:** lịch sử, tường thuật gỡ lỗi, hay thứ
đã nằm trong code / `git log`.
