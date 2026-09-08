---
description: Thiết lập và bắt đầu dùng Chat With Insight
---

Chạy quy trình sau bằng **tiếng Việt thân thiện, không dùng thuật ngữ kỹ thuật**.

1. Đọc `${CLAUDE_PLUGIN_ROOT}/knowledge/index.md` lấy `database_id` và tên schema hiện dùng — ĐỪNG hardcode
   giá trị prod, Metabase local dùng schema khác (xem `memory/kien-truc-plugin.md` nếu cần đối chiếu).
2. Thử gọi tool chạy SQL trên insight (`execute_sql`) với `{"database_id": <vừa đọc>, "sql": "select 1 as x"}`.
   - Nếu **không có tool nào của insight** trong phiên, hoặc gọi ra lỗi chưa xác thực / chưa kết nối →
     chạy mục "Chưa kết nối được insight" bên dưới rồi DỪNG. Đừng đoán mò, đừng bịa số.
3. Chạy tiếp một câu kiểm cấu trúc, dùng đúng schema vừa đọc ở bước 1:
   `select count(*)::int from information_schema.tables where table_schema = '<schema vừa đọc>'`
   Kết quả 0 → **đừng khẳng định "chưa thấy dữ liệu"** — có thể chỉ là đang trỏ nhầm Metabase (vd local thay
   vì prod, hoặc schema đã đổi). Báo: *"Em kết nối được nhưng đếm ra 0 bảng — có thể đang trỏ nhầm Metabase
   hoặc schema đã đổi. Nhờ anh/chị báo bên kỹ thuật kiểm tra giúp em."*
4. Trình bày ✅/⚠ đúng hai dòng: *kết nối insight*, *đọc được dữ liệu XLeaders*.
5. In 5 câu hỏi mẫu:
   - "Doanh thu lớp CEO.QTKH.K01 là bao nhiêu?"
   - "Tháng này có bao nhiêu học viên ghi danh chính thức?"
   - "Hiệu suất của Sale Phương Anh 3 tháng gần đây thế nào?"
   - "Lớp nào sắp khai giảng mà còn ít người đăng ký nhất?"
   - "Dựng cho tôi báo cáo doanh thu theo khoá học năm nay"
6. Kết bằng đúng 3 ý, mỗi ý một dòng:
   - Cứ hỏi bằng tiếng Việt bình thường, em sẽ tra số và nói rõ "Cách tính:".
   - Muốn có báo cáo riêng thì bảo em dựng — báo cáo nằm trong thư mục riêng của anh/chị trên insight, dùng
     đúng quyền tài khoản anh/chị đang có (em không mở rộng thêm được, cũng không tự siết lại được).
   - Không cần nữa thì bảo em gỡ — báo cáo vào Thùng rác Metabase, khôi phục lại được, không mất vĩnh viễn.

## Chưa kết nối được insight

**ĐỪNG bảo người dùng gõ `/mcp`** trừ khi họ nói rõ đang dùng bản terminal — khung chat của app Claude không
có lệnh đó, hướng dẫn sai làm họ bế tắc. Nói đúng một lần, ngắn, rồi dừng:

> *"Em chưa nối được vào insight ạ. Anh/chị mở **Cài đặt → Connectors** (trong app Claude hoặc trên
> claude.ai), tìm dòng **insight**, bấm **Connect** rồi đăng nhập bằng đúng tài khoản insight anh/chị vẫn
> dùng. Xong quay lại đây gõ `/start` giúp em."*

Nếu người dùng báo **không thấy dòng `insight`** trong danh sách Connectors — đây là ca thường gặp nhất, và
nhân viên thường KHÔNG tự thêm được (gói Team/Enterprise chỉ chủ tài khoản mới thêm connector). Đưa cho họ
đoạn nhắn sẵn để chuyển cho người quản trị, đừng bắt họ tự diễn giải:

> *"Anh/chị nhờ người quản trị tài khoản Claude của công ty bật giúp kết nối này, gửi họ đúng đoạn sau:*
> *«Vào Organization settings → Connectors → Add → Custom → Web, dán URL
> `https://insight.xteam.edu.vn/api/metabase-mcp`, lưu lại. Sau đó mỗi người trong công ty tự vào
> Connectors bấm Connect và đăng nhập tài khoản insight của mình.»"*

Nếu người dùng nói họ đang dùng **Claude Code bản terminal / VS Code**: gõ `/mcp`, chọn dòng `insight`, bấm
**Authenticate**, đăng nhập rồi đồng ý.

Không in ra id kỹ thuật, đường dẫn file, hay tên tool cho người dùng.
