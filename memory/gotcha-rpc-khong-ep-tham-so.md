---
name: gotcha-rpc-khong-ep-tham-so
description: rpc.mjs KHÔNG kiểm inputSchema — `required` và `enum` chỉ là mô tả cho model đọc; mọi tool phải tự validate, nếu không sẽ lộ lỗi kỹ thuật tiếng Anh hoặc mở đường đi ngoài dự kiến
type: experience
---

`inputSchema` trong khai báo tool **không được server thực thi**. `required`, `enum`, `additionalProperties`
chỉ là gợi ý cho model AI đọc. Một client (hoặc một lượt model đi sai) truyền thiếu/sai tham số sẽ đi thẳng
vào `onCall`.

## Ba hậu quả đã gặp thật

**Lộ lỗi nội bộ bằng tiếng Anh.** `cwi_query {mode:'sql'}` thiếu `sql` →
`MetabaseError: POST /api/dataset → 500: Assert failed: (string? sql)` — assertion Clojure của Metabase, hiện
thẳng trước mặt nhân viên không biết code. Thiếu `model` → `Không thấy Model "undefined"`, đọc như người dùng
gõ sai tên chứ không phải quên tham số.

**Nổ `TypeError` thô.** `cwi_report {action:'update_card', id:55}` quên `patch` →
`Cannot read properties of undefined`. Fail-closed (0 lời gọi ghi) nhưng vẫn là ngõ cụt cho người dùng.

**Mở đường đi ngoài hợp đồng.** `getEntity` ghép `kind` thẳng vào `/api/${kind}/${id}`. Không có allowlist thì
`kind:'user'` đọc `/api/user/1`, `kind:'setting'` đọc cấu hình site, `kind:'database'` đọc cấu hình kết nối —
tool được công bố là "đọc thẻ/báo cáo" nhưng thực chất là **proxy GET vào toàn bộ `/api/*`**. Không ghi được gì
và vẫn bị chặn bởi quyền Metabase thật của người dùng, nhưng vượt xa thứ đã hứa.

## Quy tắc

Mọi tool tự kiểm tham số ở đầu nhánh `onCall`, **đặt TRƯỚC `connect()`** để tham số sai không tốn một lần kết
nối. Thông điệp tiếng Việt, nói rõ thiếu gì và làm sao lấy được giá trị đúng
(vd *"Gọi cwi_dict {list:true} để xem danh sách Model có sẵn."*).

Giá trị đến từ ngoài mà được ghép vào **đường dẫn API** thì phải có **allowlist**, không chỉ dựa vào `enum`
trong schema. Cách chứng minh còn sống: gọi tool với `kind` lạ và assert **0 lời gọi API** xảy ra.
