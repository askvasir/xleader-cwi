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

Công cụ **chỉ tạo và sửa báo cáo trong thư mục riêng của bạn**. Có HAI lớp bảo vệ, không phải một:

- **Lớp 1 — Metabase từ chối ở phía máy chủ** (quyền collection: group "All Users" chỉ `read` trên các
  collection dùng chung). Đây là lớp bảo vệ THẬT SỰ, không phụ thuộc plugin cư xử đúng — nhưng **phải được
  quản trị bật riêng trên từng server** bằng `scripts/siet-quyen-collection.mjs --apply`. **Trạng thái hiện
  tại: đã bật trên local, CHƯA bật trên prod (`insight.xteam.edu.vn`)** — tới khi bật, việc plugin "không sửa
  được báo cáo chung" chỉ còn là hành vi của LỚP 2, tức là hành vi của phần mềm này, không phải một chốt chặn
  độc lập ở máy chủ.
- **Lớp 2 — guardrail trong code plugin** (`plugin/mcp/guard.mjs`): chặn SỚM, báo lỗi tiếng Việt dễ hiểu, và
  chỉ cho phép ghi qua đúng một đường (`plugin/mcp/report.mjs`). Đây là lớp tiện dụng, KHÔNG phải lớp an toàn
  cuối cùng — chạy độc lập với việc Lớp 1 đã bật hay chưa.

**Giới hạn đã biết:** phiên đăng nhập insight (`~/.xleader-cwi/session.json`, quyền file 0600) là phiên THẬT
của chính người dùng. Trên máy đã đăng nhập, ai có quyền đọc file đó vẫn gọi thẳng API Metabase ngoài plugin
— đường đó không đi qua guardrail của plugin và plugin không kiểm soát được.

Gỡ báo cáo = đưa vào Thùng rác Metabase (khôi phục được), không xoá vĩnh viễn.

## Dành cho người bảo trì

- Từ điển dữ liệu sinh bằng `node scripts/gen-cwi-dictionary.mjs` trong repo `xleaders-crm-app`.
- Quy trình nạp lại khi schema đổi nằm trong skill `/build-metabase-report`.
- Chạy test: `node --test`
- Siết quyền collection (guardrail lớp 1): `node scripts/siet-quyen-collection.mjs [--apply]`
- Repo ở `askvasir/xleader-cwi`, để **private** vì từ điển mô tả cấu trúc kinh doanh và tên đội Sale.
  Người dùng phải được cấp quyền đọc repo thì lệnh cài mới chạy.
