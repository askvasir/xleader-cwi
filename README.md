# xleader-cwi — Chat With Insight

Hỏi dữ liệu kinh doanh XLeaders bằng tiếng Việt và tự dựng báo cáo riêng trên `insight.xteam.edu.vn`,
ngay trong Claude Code. Không cần biết SQL.

## Cài đặt (làm một lần)

> Repo: `github.com/askvasir/xleader-cwi` (**private** — cần quyền đọc repo mới cài được).

```
/plugin marketplace add askvasir/xleader-cwi
/plugin install xleader-cwi@xleader-cwi
/start
```

Bật **auto update** trong màn hình `/plugin` để máy tự cập nhật khi cấu trúc dữ liệu thay đổi.

## Dùng thế nào

Cứ hỏi bình thường:
- *"Doanh thu lớp CEO.QTKH.K01 là bao nhiêu?"*
- *"Tháng này có bao nhiêu học viên ghi danh chính thức?"*
- *"Hiệu suất của Sale Phương Anh 3 tháng gần đây thế nào?"*
- *"Dựng cho tôi báo cáo doanh thu theo khoá học năm nay"*

Mỗi câu trả lời đều kèm **"Cách tính:"** để bạn biết con số đó nghĩa là gì.

## Phạm vi an toàn

Plugin đăng nhập bằng **chính tài khoản insight của bạn**, qua OAuth khi bạn bấm Authenticate ở `/mcp` —
không có ô nhập mật khẩu nào cả, và plugin **không lưu mật khẩu** ở bất cứ đâu.

Vì vậy, bạn làm được gì trên insight qua plugin cũng chính là **đúng những gì tài khoản của bạn vốn đã làm
được**. Plugin không mở rộng thêm quyền, và cũng không tự siết bớt quyền của bạn.

Mặc định, plugin **luôn dựng báo cáo trong thư mục riêng của bạn**, và **không tự ý sửa báo cáo chung của
công ty** — kể cả khi tài khoản của bạn có quyền sửa. Đây là quy ước được ghi trong hướng dẫn của plugin,
không phải một rào chặn kỹ thuật không thể vượt qua; nếu bạn thật sự cần sửa báo cáo chung, plugin sẽ hỏi
xác nhận trước khi làm. Muốn chặn cứng việc sửa báo cáo chung ở mức không thể lách, phải siết **quyền
collection phía Metabase** cho tài khoản đó — việc này nằm ngoài phạm vi plugin.

Mọi truy vấn số liệu là chỉ đọc theo thiết kế của plugin; plugin không tự chạy các thao tác ghi ngoài việc
tạo/sửa báo cáo mà bạn yêu cầu.

Gỡ báo cáo = đưa vào Thùng rác Metabase (khôi phục được), không xoá vĩnh viễn.

## Dành cho người bảo trì

- Tri thức nghiệp vụ nằm dưới `plugin/knowledge/` (Markdown, cắt lát theo chỉ số) — sửa tay khi số liệu đổi.
- Repo ở `askvasir/xleader-cwi`, để **private** vì tri thức mô tả cấu trúc kinh doanh và tên đội Sale.
  Người dùng phải được cấp quyền đọc repo thì lệnh cài mới chạy.
