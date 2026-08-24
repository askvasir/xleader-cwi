---
name: kien-truc-plugin
description: Kiến trúc plugin xleader-cwi v0.2 — plugin không có dòng code nào, khai remote MCP gốc của Metabase, OAuth 2.1 per-user, cấu trúc knowledge/ cắt lát, vòng lặp phát triển mới
type: foundation
---

Plugin Claude Code cho nhân viên XLeaders (Sale, kế toán, sếp — **không biết code, không biết SQL**) hỏi dữ
liệu kinh doanh và tự dựng dashboard trên Metabase `insight.xteam.edu.vn`.

## Plugin không có dòng code nào

Từ v0.2, `plugin/` chỉ còn Markdown + một file JSON. Toàn bộ năng lực kỹ thuật (chạy SQL, tìm báo cáo, tạo/sửa
thẻ và dashboard) đến từ **remote MCP gốc do Metabase tự host**, không phải server tự viết. `plugin/.mcp.json`:

```json
{
  "mcpServers": {
    "insight": {
      "type": "http",
      "url": "https://insight.xteam.edu.vn/api/metabase-mcp"
    }
  }
}
```

Xác thực là **OAuth 2.1 per-user**: người dùng gõ `/mcp` → chọn `insight` → `Authenticate`, Claude Code tự lo
toàn bộ luồng OAuth (mở trình duyệt, PKCE, lưu token) và tự quản lý việc lưu token. Plugin **không chạm vào
mật khẩu hay bất kỳ thông tin đăng nhập nào** — không có chỗ nào trong plugin đọc, ghi, hay yêu cầu nhập mật
khẩu.

## Vai trò từng phần

| Phần | Trách nhiệm |
|---|---|
| `plugin/.mcp.json` | khai server `insight` — toàn bộ "hạ tầng" của plugin |
| `plugin/knowledge/` | tri thức nghiệp vụ, cắt lát theo chỉ số (xem dưới) |
| `plugin/skills/hoi-du-lieu/SKILL.md` | kỷ luật trả lời câu hỏi số liệu + kỷ luật token |
| `plugin/skills/dung-bao-cao/SKILL.md` | quy trình dựng/sửa/gỡ báo cáo — mục "Hợp đồng payload dashboard" hiện thú nhận CHƯA kiểm bằng thực nghiệm, chưa phải hợp đồng thật |
| `plugin/commands/start.md` | nối MCP, kiểm nhanh, 5 câu hỏi mẫu |

Tool hay dùng của server `insight`: `execute_sql` (chỉ đọc, mọi câu trả lời số liệu đi qua đây) ·
`execute_question` (chạy một Model có sẵn, dùng để đối soát) · `search` · `read_resource` (đọc MỘT card/dashboard
cụ thể — đắt, đừng dùng để tra cấu trúc bảng) · `create_question` / `update_question` ·
`create_dashboard` / `update_dashboard` · `create_collection` · `create_metric`.

## Đích Metabase

| | database_id | schema | Metabase |
|---|---|---|---|
| **Prod** `insight.xteam.edu.vn` | `2` | `workspace_6ytci89jf3kflsl9aaaxrr5hw` (883 cột, đo 24/08) | v0.63.14.2 |
| **Local** `localhost:3001` | tự kiểm, ĐỪNG giả định bằng 2 | `workspace_1wgvd1injqtife6y4rvfbu3h5` | v0.63.14.2, cũng có `/api/metabase-mcp` |

## Cấu trúc `knowledge/` — vì sao cắt lát

`plugin/knowledge/` là Markdown thuần, không có snapshot cấu trúc dữ liệu (`.json`) đóng gói trong repo —
cấu trúc bảng đọc SỐNG bằng `information_schema` mỗi lần cần.

Một file tri thức gộp đủ mọi chỉ số sẽ nặng hàng nghìn token — đọc cả file mỗi câu hỏi vỡ trần ngân sách
token trước khi chạm dữ liệu. Vì vậy tri thức được cắt lát để mỗi skill chỉ đọc đúng phần cần:

| File | Nội dung |
|---|---|
| `knowledge/index.md` | database_id, schema, 10 bảng gốc dùng vào việc gì, cách tra cấu trúc rẻ, bảng điều hướng "hỏi về X → đọc file nào" |
| `knowledge/quy-tac-chung.md` | 10 quy tắc nghiệp vụ đúc kết từ nhiều tháng đối soát + khoảng trống dữ liệu |
| `knowledge/chi-so/*.md` | một file mỗi chỉ số lõi (doanh thu, số vé, ghi danh, cơ hội/phễu, lớp học, đối tác doanh nghiệp) — mỗi file có "Cách tính:", câu SQL đã đối soát với Model, và bẫy riêng của chỉ số đó. Chỉ số thứ 7 "Phân loại kênh" CÓ CHỦ Ý không có khối SQL chuẩn riêng — chưa đối soát được với Model nên chỉ có quy tắc phân loại (trong `chi-so/co-hoi-tang-pheu.md`), không có "Đã đối soát" |
| `knowledge/doi-soat.md` | 7 Model dùng làm đường đối chứng độc lập (không dùng để trả lời trực tiếp) |
| `knowledge/chua-chot/*.md` | các câu hỏi nghiệp vụ chưa chốt quy tắc — xem [[chua-chot-nghiep-vu]] |

Hai skill chỉ đọc đúng một hàng trong bảng điều hướng của `index.md` theo loại câu hỏi, không đọc cả thư mục.

## Vòng lặp phát triển

Không có test tự động — không còn logic runtime nào ngoài Markdown để chạy kiểm.

```
sửa tri thức/skill → chạy thật câu hỏi mẫu qua execute_sql của server insight → đối soát số →
chạy đủ 7 phép trong nghiem-thu.md → commit
```

`nghiem-thu.md` ở gốc repo là checklist kiểm tay trước mỗi lần phát hành — kiến trúc hiện tại không có test
tự động nào.

## Phát hành

`github.com/askvasir/xleader-cwi` — **private**. Cài: `/plugin marketplace add askvasir/xleader-cwi` →
`/plugin install xleader-cwi@xleader-cwi` → `/mcp` chọn `insight` bấm `Authenticate` → `/start`.

Bump version ở **CẢ HAI** manifest rồi push thì auto-update mới nhận:
`.claude-plugin/marketplace.json` → `plugins[0].version` · `plugin/.claude-plugin/plugin.json` → `version`.
