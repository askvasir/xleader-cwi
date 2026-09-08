# xleader-cwi — Chat With Insight

Hỏi dữ liệu kinh doanh XLeaders bằng tiếng Việt và tự dựng báo cáo riêng trên `insight.xteam.edu.vn`,
ngay trong Claude — app trên máy, trên web, hay bản Claude Code cho dân kỹ thuật. Không cần biết SQL.

## Dành cho người quản trị — bật một lần cho cả công ty

Nhân viên **không tự thêm được** kết nối insight: trên gói Team/Enterprise chỉ chủ tài khoản (Owner) mới
thêm connector được. Làm hai việc sau một lần, sau đó nhân viên chỉ còn bấm **Connect**.

**1. Thêm connector `insight`** — vào **Organization settings → Connectors → Add → Custom → Web**, dán URL:

```
https://insight.xteam.edu.vn/api/metabase-mcp
```

Không cần điền ID/secret gì thêm. Connector này dùng OAuth per-user: mỗi người đăng nhập bằng chính tài
khoản insight của họ, nên quyền của ai vẫn đúng bằng quyền người đó.

**2. Đẩy plugin cho cả công ty** — vào **Organization settings → Plugins**, sync marketplace
`askvasir/xleader-cwi` rồi đặt chế độ *Installed by default* (hoặc *Required*). Từ đó máy nhân viên tự có
skill và tri thức, không ai phải gõ lệnh cài.

> Nếu công ty dùng các tài khoản Pro cá nhân riêng lẻ (không có Organization settings), mỗi người tự thêm
> connector một lần ở **Cài đặt → Connectors → Add → Custom** với đúng URL trên.

## Dành cho nhân viên

Mở **Cài đặt → Connectors**, tìm dòng **insight**, bấm **Connect**, đăng nhập bằng tài khoản insight của
bạn rồi bấm đồng ý. Xong gõ `/start`.

Không thấy dòng **insight**? Nhờ người quản trị tài khoản Claude của công ty làm bước 1 ở trên — bạn không
tự thêm được, và đó không phải lỗi của bạn.

### Nếu bạn dùng Claude Code bản terminal / VS Code

Ở bản này plugin tự mang kết nối theo, cài bằng lệnh:

```
/plugin marketplace add askvasir/xleader-cwi
/plugin install xleader-cwi@xleader-cwi
/mcp
```

Trong màn hình `/mcp`, chọn dòng `insight` và bấm **Authenticate**. Lệnh `/mcp` **chỉ có ở bản terminal** —
trong khung chat của app Claude không gõ được, ở đó dùng đường Connectors phía trên.

Bật **auto update** trong màn hình `/plugin` để máy tự nhận bản plugin mới khi đội kỹ thuật phát hành (sửa
tri thức nghiệp vụ, sửa skill…). Plugin **không** tự phát hiện khi dữ liệu/cấu trúc bảng bên Metabase thay
đổi — không còn cơ chế theo dõi trôi schema nào trong plugin.

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

Mọi truy vấn số liệu là chỉ đọc theo **quy ước trong hướng dẫn** của plugin — plugin tự giác không chạy thao
tác ghi ngoài việc tạo/sửa báo cáo bạn yêu cầu. Đây không phải một chặn cứng kỹ thuật: `execute_sql` chạy
SQL tuỳ ý với đúng quyền tài khoản insight của bạn, và không còn dòng code nào của plugin đứng chắn trên
đường đó. Muốn chặn cứng phải siết ở quyền Metabase, như đoạn trên đã nói.

Gỡ báo cáo = đưa vào Thùng rác Metabase (khôi phục được), không xoá vĩnh viễn.

## Dành cho người bảo trì

- Tri thức nghiệp vụ nằm dưới `plugin/knowledge/` (Markdown, cắt lát theo chỉ số) — sửa tay khi số liệu đổi.
- Repo ở `askvasir/xleader-cwi`, để **private** vì tri thức mô tả cấu trúc kinh doanh và tên đội Sale.
  Ai cài bằng lệnh `/plugin marketplace add` phải được cấp quyền đọc repo; còn đường đẩy qua Organization
  settings → Plugins thì claude.ai tự đọc repo qua Claude GitHub App, người dùng không cần quyền git.
- Kết nối tới Metabase đi hai đường khác nhau tuỳ bề mặt: bản terminal dùng `plugin/.mcp.json` của plugin,
  app Claude/web dùng connector khai ở Organization settings. Tool vì thế mang tên khác nhau — skill phải
  gọi theo năng lực (`execute_sql`…), không bám tên server.
