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
- Lưu công thức báo cáo vào `~/.xleader-cwi/reports/<slug>.json` (tên thẻ, câu truy vấn, bố cục) để lần sau
  sửa được. **Không nhắc file này với người dùng** — đó là chuyện nội bộ.
- Đưa link dashboard và mô tả một câu mỗi thẻ bằng tiếng Việt.

## Khi người dùng đòi sửa báo cáo chung
Từ chối **kèm lối ra**, đúng câu này:
*"Báo cáo đó là báo cáo chung của công ty nên em không sửa được. Em tạo một bản riêng trong thư mục của
anh/chị rồi chỉnh thoải mái nhé?"*
Nếu họ đồng ý → đọc cấu hình báo cáo chung (đọc thì được), tạo bản sao trong thư mục riêng của họ.

## Gỡ báo cáo
Chỉ `archive` (vào Thùng rác, khôi phục được), và chỉ với báo cáo của chính họ. **Hỏi xác nhận trước.**
Không có xoá vĩnh viễn.
