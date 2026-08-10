---
name: dung-bao-cao
description: Dùng khi người dùng muốn tạo, sửa, hoặc gỡ một báo cáo/dashboard riêng trên insight — "dựng cho tôi báo cáo…", "thêm cột X vào báo cáo hôm trước", "bỏ biểu đồ này đi".
---

# Dựng báo cáo riêng trên insight

Báo cáo được tạo trong **thư mục riêng của chính người dùng**. Bạn **không có cách nào** đụng tới báo cáo
chung — `cwi_report` sẽ từ chối. Đó là thiết kế, không phải giới hạn cần lách.

## Trước khi dựng
Gọi `cwi_health`. Nếu `tu_dien_khop` là `false` → **DỪNG**, báo:
*"Cấu trúc dữ liệu trên insight vừa thay đổi nên em chưa dám dựng báo cáo — số có thể sai. Nhờ anh/chị báo
bên kỹ thuật cập nhật plugin giúp em."* Không dựng bừa.

## Hỏi đúng 3 câu nghiệp vụ (đừng hỏi hơn)
1. Báo cáo này trả lời câu hỏi gì?
2. Nhìn theo lát cắt nào — lớp, Sale, khoá học, hay thời gian?
3. Cần lọc gì không (khoảng thời gian, một lớp cụ thể)?

## Dựng
1. Ưu tiên thẻ dựng trên Model (`cwi_dict` / `cwi_query {mode:'model'}`) — thẻ kiểu này người dùng bấm vào
   xem được bản ghi gốc.
2. Chỉ 5 kiểu hiển thị: `scalar` · `table` · `bar` · `line` · `funnel`.
3. **Chạy thử NGAY từng thẻ sau khi tạo** bằng `cwi_query`. Thẻ lỗi thì sửa — **không bao giờ bàn giao báo
   cáo còn thẻ đỏ**.
4. **Kiểm tra chéo bắt buộc:** với mỗi con số KPI, đếm lại bằng **một đường độc lập** (thẻ dựng trên Model thì
   đếm lại bằng `mode:'sql'` từ bảng gốc, và ngược lại).
   - Khớp → nói ✅ "đã đối chiếu, số khớp".
   - Lệch → nói thẳng: *"⚠ số này em chưa chắc — cách đếm khác ra <X>, lệch <Y>."* **Tuyệt đối không im
     lặng.**
5. Bộ lọc — áp dụng sẵn 3 bài học đã trả giá thật khi làm báo cáo cho công ty này:
   - Biến native chỉ nhận MỘT giá trị ⇒ tham số dashboard phải đặt `isMultiSelect: false`.
   - Khi người dùng xoá trắng một ô lọc, Metabase gửi **chuỗi rỗng** chứ không phải "không gửi gì" ⇒ mọi khối
     lọc phải mở đầu bằng `{{x}} = '' or …` để chuỗi rỗng nghĩa là "không lọc".
   - Tham số ngày bỏ trống sẽ thành **NULL** (so sánh với NULL luôn rỗng, không báo lỗi) ⇒ dùng
     `coalesce({{tu}}, '0001-01-01'::date)` / `coalesce({{den}}, '9999-12-31'::date)`.

## Sau khi dựng
- Đưa link dashboard và mô tả một câu mỗi thẻ bằng tiếng Việt.

## Muốn sửa báo cáo cũ (của chính người dùng)
Không có file nào lưu lại công thức báo cáo — tìm và đọc lại thẳng từ insight:
1. `cwi_report {action:'list'}` để tìm đúng thẻ/dashboard theo tên.
2. `cwi_report {action:'get', kind, id}` để đọc lại cấu hình hiện tại (`dataset_query`, `display`, `dashcards`…).
3. Sửa trên cấu hình vừa đọc rồi gọi `update_card` (thẻ) hoặc `put_dashcards` (bố cục dashboard) — xem
   "Hợp đồng payload dashboard" bên dưới khi sửa `dashcards`.

## Trùng tên khi tạo lại một báo cáo đã có (bài học đã trả giá trên prod)
Metabase **không tự chặn trùng tên** — dashboard #7 từng bị tạo trùng #6 vì đi tạo mới thay vì tìm bản cũ.
Trước khi `create_card` / `create_dashboard`:
1. `cwi_report {action:'list'}` rồi tìm theo **tiền tố tên** (đừng đòi khớp tuyệt đối — khách có quyền đổi
   tên thêm chữ phía sau).
2. Thấy rồi → `update_card` / `put_dashcards` để cập nhật bản đã có, **KHÔNG gửi lại `name` trong patch**
   (khách có thể đã tự đổi tên; gửi lại `name` cũ sẽ ghi đè tên họ vừa đặt).
3. Không thấy → mới `create_card` / `create_dashboard`.

## Hợp đồng payload dashboard (`put_dashcards`)
Metabase đòi đúng hình dạng này cho `dashcards`, không phải danh sách tuỳ ý:
- Mỗi thẻ MỚI phải có `id` là số **ÂM tạm thời** (vd `-1`, `-2`…, khác nhau trong cùng một lần PUT) — Metabase
  tự đổi thành id thật khi lưu.
- Bắt buộc kèm `dashboard_id`, `card_id`, `col`/`row`/`size_x`/`size_y`, `series: []`, `parameter_mappings: []`
  (rỗng nếu thẻ không nhận tham số dashboard).
- Thẻ SQL gốc (native) muốn nhận tham số dashboard thì câu SQL phải khai `{{ten_bien}}` VÀ card phải có
  `template-tags` khai đúng tên biến đó; `parameter_mappings` trỏ vào bằng
  `target: ['variable', ['template-tag', 'ten_bien']]`.
- Xem ví dụ thật đã chạy trên prod: `~/project/xleaders-crm-app/metabase/build-revenue-dashboard.mjs`
  (đoạn dựng biến `dashcards`).

## Khi người dùng đòi sửa báo cáo chung
Từ chối **kèm lối ra**, đúng câu này:
*"Báo cáo đó là báo cáo chung của công ty nên em không sửa được. Em tạo một bản riêng trong thư mục của
anh/chị rồi chỉnh thoải mái nhé?"*
Nếu họ đồng ý → gọi `cwi_report {action:'get', kind:'dashboard'|'card', id}` để đọc cấu hình báo cáo chung
(đọc thì được, không bị guard chặn), rồi dựng lại các thẻ tương đương trong thư mục riêng của họ.

## Gỡ báo cáo
Chỉ `archive` (vào Thùng rác, khôi phục được), và chỉ với báo cáo của chính họ. **Hỏi xác nhận trước.**
Không có xoá vĩnh viễn.
