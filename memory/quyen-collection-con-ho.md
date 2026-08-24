---
name: quyen-collection-con-ho
description: Lỗ hổng quyền ghi vào collection dùng chung trên prod Metabase — chưa siết, có sẵn từ trước, và cách siết lại
type: foundation
---

Trên `insight.xteam.edu.vn`, bất kỳ nhân viên nào (tài khoản thường, `is_superuser:false`) hiện vẫn **ghi được**
vào các collection dùng chung — đo được HTTP **200** thay vì 403. **Lỗ hổng này có sẵn từ trước khi có plugin
xleader-cwi**, không phải refactor v0.2 sinh ra.

## Chốt chặn đúng nằm ở đâu

Plugin không còn dòng code nào, nên không có guard nào trong plugin để chặn việc này. Chốt chặn đúng là
**quyền collection phía Metabase**: đặt group "All Users" = `read` (thay vì `write`) trên các collection dùng
chung. Sau đó Metabase tự trả `403` cho mọi thao tác ghi vào đó — kể cả khi ai đó gọi API trực tiếp, không
qua Claude Code. Đây là cơ chế THẬT duy nhất; lời hứa "không tự ý sửa báo cáo chung" trong skill chỉ là quy
ước hành xử, không phải rào chặn kỹ thuật, chừng nào quyền collection trên prod chưa được siết.

## Đã chứng minh 403/200

Hai script từng chứng minh cơ chế này hoạt động, **đã bị xoá khỏi repo ở commit `9361c50`** (dọn mã nguồn khi
plugin chuyển sang MCP gốc). Lấy lại bằng:

```bash
git show 9361c50^:scripts/siet-quyen-collection.mjs
git show 9361c50^:scripts/smoke-guardrail.mjs
```

`siet-quyen-collection.mjs` đặt quyền `read` lên các collection khớp tiền tố "XLeaders – …" và bỏ qua
collection không khớp (script không tự cảnh báo nếu khách đổi tên khỏi tiền tố này). `smoke-guardrail.mjs`
tạo một user thật để đo: cá nhân = được (200), chung = bị chặn (403).

Đo trên local `localhost:3001`: **đã siết**, cá nhân `200` / chung `403`. Trên prod
`insight.xteam.edu.vn`: **chưa siết**.
