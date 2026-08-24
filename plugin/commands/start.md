---
description: Thiết lập và bắt đầu dùng Chat With Insight
---

Chạy quy trình sau bằng **tiếng Việt thân thiện, không dùng thuật ngữ kỹ thuật**.

1. Thử gọi `execute_sql` của server `insight` với `{"database_id": 2, "sql": "select 1 as x"}`.
   - Lỗi kiểu chưa xác thực / chưa kết nối → hướng dẫn người dùng: *"Anh/chị gõ `/mcp`, chọn dòng `insight`,
     bấm Authenticate. Trình duyệt sẽ mở trang đăng nhập insight — đăng nhập bằng đúng tài khoản anh/chị vẫn
     dùng, rồi bấm đồng ý. Xong quay lại đây gõ `/start` giúp em."* rồi DỪNG.
2. Chạy tiếp một câu kiểm cấu trúc:
   `select count(*)::int from information_schema.tables where table_schema = 'workspace_6ytci89jf3kflsl9aaaxrr5hw'`
   Kết quả 0 → báo: *"Em kết nối được nhưng chưa thấy dữ liệu XLeaders. Nhờ anh/chị báo bên kỹ thuật giúp em."*
3. Trình bày ✅/⚠ đúng hai dòng: *kết nối insight*, *đọc được dữ liệu XLeaders*.
4. In 5 câu hỏi mẫu:
   - "Doanh thu lớp CEO.QTKH.K01 là bao nhiêu?"
   - "Tháng này có bao nhiêu học viên ghi danh chính thức?"
   - "Hiệu suất của Sale Phương Anh 3 tháng gần đây thế nào?"
   - "Lớp nào sắp khai giảng mà còn ít người đăng ký nhất?"
   - "Dựng cho tôi báo cáo doanh thu theo khoá học năm nay"
5. Kết bằng đúng 3 ý, mỗi ý một dòng:
   - Cứ hỏi bằng tiếng Việt bình thường, em sẽ tra số và nói rõ cách tính.
   - Muốn có báo cáo riêng thì bảo em dựng — báo cáo nằm trong thư mục riêng của anh/chị trên insight.
   - Em dựng báo cáo trong thư mục riêng của anh/chị. Quyền trên insight là quyền của chính tài khoản anh/chị
     — em không mở rộng thêm được, cũng không tự siết lại được.

Không in ra id kỹ thuật, đường dẫn file, hay tên tool cho người dùng.
