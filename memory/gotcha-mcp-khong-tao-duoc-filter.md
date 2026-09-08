---
name: gotcha-mcp-khong-tao-duoc-filter
description: MCP gốc của Metabase không tạo/đọc/sửa được bộ lọc dashboard, trường thừa bị bỏ im lặng — kèm đường vòng đã chốt (thẻ MBQL tự nối + xác nhận bằng slug trong link)
type: experience
---

## Ba việc MCP KHÔNG làm được với bộ lọc dashboard

Đo 08/09/2026 trên prod `insight.xteam.edu.vn` (Metabase `v0.63.14.2` — bản open source):

1. **Không tạo được.** Không tool nào có `parameters`. `update_dashboard.dashcards` chỉ có ba hành động
   `add` / `remove` / `move`, không có `parameter_mappings`.
2. **Không đọc được.** `read_resource` trên `metabase://dashboard/{id}/items` chỉ trả về danh sách thẻ.
   Đo trên dashboard #2 "Báo cáo Lead theo Lớp" — dashboard **chắc chắn có** ô lọc Lớp (câu hỏi #169
   "Danh sách Lớp (nguồn ô lọc)" nằm cùng thư mục) — vẫn không thấy một chữ nào về `parameters`.
3. **Không xác nhận được.** Hệ quả của (2).

## Bẫy chết người: trường thừa bị bỏ IM LẶNG

Gửi kèm `parameters` vào một tool → call trả **200 bình thường**, trường bị vứt, **không có lỗi**. Nên mẹo
"gọi tối thiểu rồi đọc thông điệp lỗi để dò trường" **không dùng được** ở đây: không có lỗi nào để đọc, chỉ
có một thành công giả. Đây là đúng loại lỗi "chạy sạch nhưng sai" mà `CLAUDE.md` cảnh báo.

Vết đã có trên prod: mô tả dashboard #9 ghi *"Thêm bộ lọc khoảng ngày: cột NgayChuyenKhoan cho card ①②③…"* —
một agent đời trước nhét hướng dẫn vào metadata vì không tự làm được, và không ai bấm.

## Đường vòng đã chốt (nằm trong `plugin/skills/dung-bao-cao/SKILL.md`)

Người dùng bấm **một lần cho mỗi dashboard**, cwi lo phần còn lại:

- Thẻ phải là **MBQL trên Model/bảng**, mọi thẻ phơi **cùng một cột lọc**. Metabase tự nối bộ lọc vào mọi
  thẻ có cột đó — *kể cả thẻ thêm vào SAU khi bộ lọc đã tồn tại* (tài liệu Metabase xác nhận). Đây là lý do
  thật sự của quy tắc "ưu tiên thẻ trên Model" trong skill.
- SQL tay **không tự nối được** — phải có biến `{{ten_bien}}` và người dùng ánh xạ tay từng thẻ.
- **Xác nhận bằng slug:** bảo người dùng bấm thử ô lọc rồi dán lại link. Link có `?lop=A12` ⇒ bộ lọc có
  thật, slug là `lop`. Chưa có link thì báo cáo **chưa xong**.

## Về template-tag trong SQL tay

- `construct_native_query` **tự phân tích `{{bien}}` thành template-tag** (đo: card #191 lưu ra đúng
  `{"name":"tu","type":"text","display-name":"Tu"}`). Không phải khai báo gì thêm.
- Tag luôn `type: text`; muốn lọc ngày thì tự `::date` trong SQL.
- `display-name` sinh từ tên biến và **không sửa được qua MCP** ⇒ đặt tên biến tử tế ngay.
- ⚠ `execute_question` **từ chối mọi thẻ có template-tag** ("This question takes parameters, which agent
  execution does not yet support") — kể cả tag tuỳ chọn `[[…]]`. Mất đường chạy thử và mất một nhánh đối
  soát ⇒ phải chạy thử lại bằng `execute_sql` với giá trị thật thay vào.

## Các đường đã loại, đừng đề xuất lại

| Đường | Vì sao loại |
|---|---|
| Fork Metabase để thêm `parameters` vào MCP | Biến plugin 0-dòng-code thành gánh vận hành một bản Metabase riêng |
| Viết MCP server phụ gọi thẳng REST `PUT /api/dashboard/{id}` | Phá RÀNG BUỘC #1 và #4; không còn cần khi đường "thẻ MBQL tự nối" đã chạy |
| Metabase CLI (`mb`) + dashboards-as-code YAML | **Chỉ có trên Pro/Enterprise.** Prod đánh số `v0.63…` = bản open source (Pro/EE là `v1.63…`). Còn cần cài `npm i -g @metabase/cli` và API key quyền Admin |
| Chờ Metabase nâng cấp | v63 (7/2026) là bản mới nhất và prod **đã ở đúng đó**. Tài liệu MCP bản mới nhất vẫn không có tool đặt filter |
