---
description: Thiết lập và bắt đầu dùng Chat With Insight
---

Chạy quy trình thiết lập cho người dùng, bằng **tiếng Việt thân thiện, không dùng thuật ngữ kỹ thuật**.

1. Gọi tool `cwi_health`. Nếu `da_cau_hinh` là `false` → sang bước 2. Nếu đã cấu hình → nhảy tới bước 4.
2. Gọi tool `cwi_setup`. Người dùng sẽ thấy một ô nhập email + mật khẩu insight.
   - Nếu họ huỷ → nói "Khi nào cần thì anh/chị gõ /start lại nhé" và DỪNG.
   - Nếu sai mật khẩu → nhắc lại đúng thông điệp tool trả về, đề nghị thử đăng nhập trên web trước.
3. Gọi lại `cwi_health`.
4. Trình bày kết quả kiểm tra thành bảng ngắn ✅/⚠ với 3 dòng: *xem được dữ liệu chung*, *chạy được truy vấn*,
   *từ điển còn khớp dữ liệu thật*. Nếu có ⚠ thì nói rõ **cần nhờ ai làm gì** — đừng bắt người dùng tự đoán.
5. In 5 câu hỏi mẫu để họ dùng ngay:
   - "Doanh thu lớp CEO.QTKH.K01 là bao nhiêu?"
   - "Tháng này có bao nhiêu học viên ghi danh chính thức?"
   - "Hiệu suất của Sale Phương Anh 3 tháng gần đây thế nào?"
   - "Lớp nào sắp khai giảng mà còn ít người đăng ký nhất?"
   - "Dựng cho tôi báo cáo doanh thu theo khoá học năm nay"
6. Kết bằng đúng 3 ý, mỗi ý một dòng:
   - Cứ hỏi bằng tiếng Việt bình thường, em sẽ tra số và nói rõ cách tính.
   - Muốn có báo cáo riêng thì bảo em dựng — báo cáo nằm trong thư mục riêng của anh/chị trên insight.
   - Em chỉ tạo và sửa báo cáo trong thư mục riêng của anh/chị; báo cáo chung của công ty em không đụng vào được.

Không in ra id kỹ thuật, đường dẫn file, hay tên tool cho người dùng.
