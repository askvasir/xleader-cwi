# ⚠ CHƯA CHỐT: doanh số quy cho ai?

⚠ Con số cụ thể trong file này là VÍ DỤ ĐO TẠI MỘT THỜI ĐIỂM khi phát hiện lỗi/khác biệt — không phải số
liệu hiện tại. Cần số THẬT thì luôn TRUY VẤN lại.

Cùng một đơn đang có HAI đáp án khác nhau, chênh lệch thật:
- `opportunity."sale"` — trường quy kết chính thức
- người tạo đơn `_order."createdByName"`

Ca thật 17/08/2026: đơn `DH_260817_sang.le_001` do **Nguyễn Hằng** tạo, cơ hội do **Sàng Xuân** tạo, nhưng
`sale` gán **PHUONG_ANH**. Tính theo cách nào thì tuần đó Phương Anh có **5 vé / 77,76 triệu** hoặc
**4 vé / 61,56 triệu** — chênh 16 triệu chỉ vì một quy ước chưa chốt.

Model `Dòng đơn hàng (Vé)` còn thêm một tầng suy diễn: khi `sale` trống thì suy từ email `picId`
(`anh.dau`→PHUONG_ANH, `hue.tran`→HUE, `hang.pham`→HANG).

**Bắt buộc:** câu hỏi nào đụng tới hiệu suất/doanh số của một Sale cụ thể thì phải HỎI LẠI người dùng tính
theo cách nào, và nói rõ mình đang tính theo cách đó. Tuyệt đối không tự chọn rồi trả số. Chưa chốt quy tắc
thì chưa dựng báo cáo KPI cho Sale.
