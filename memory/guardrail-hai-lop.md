---
name: guardrail-hai-lop
description: Cơ chế "không bao giờ sửa báo cáo của người khác" — lớp 1 (Metabase trả 403) và lớp 2 (assertOwned), trạng thái hiện tại từng môi trường, và cách chứng minh nó còn sống
type: foundation
---

Yêu cầu nghiệp vụ: **plugin không bao giờ được xoá hay sửa báo cáo không phải do chính người dùng đó tạo.**
Khách có 6 dashboard chính thức đang dùng điều hành công ty trên `insight.xteam.edu.vn`.

## Lớp 1 — Metabase tự từ chối (cơ chế THẬT)

Đặt group **"All Users" = `read`** (thay vì `write`) trên các collection dùng chung. Sau đó Metabase trả
**`403`** cho mọi thao tác ghi vào đó — kể cả khi plugin có bug, kể cả khi ai đó gọi API bằng tay.

⚠ **Lỗ hổng này CÓ SẴN từ trước, không phải plugin sinh ra.** Đo được: một user thường
(`is_superuser:false`) ghi vào collection chung → **HTTP 200**. Tức trước khi siết, bất kỳ nhân viên nào cũng
sửa được báo cáo chung nếu muốn.

| Môi trường | Trạng thái | Bằng chứng |
|---|---|---|
| LOCAL `localhost:3001` | ✅ **đã siết** — 8 collection `XLeaders – …` = `read` | user thường: chung `403` · cá nhân `200` |
| PROD `insight.xteam.edu.vn` | ❌ **CHƯA siết** | — |

```bash
# xem trước (mặc định, không ghi gì)
MB_USER=<admin> MB_PASS=<mk> MB_URL=https://insight.xteam.edu.vn \
  node scripts/siet-quyen-collection.mjs
# ghi thật — ngoài localhost BẮT BUỘC thêm cờ xác nhận
… --apply --toi-hieu-day-la-prod
```

Đọc kỹ khối `⚠ … KHÔNG khớp tiền tố "XLeaders"` trong đầu ra: collection dùng chung nào **không** khớp tiền tố
sẽ **không được siết** và script không tự cảnh báo nếu khách đổi tên. Trên local đó là 4 collection seed mặc
định của Metabase (Dashboard/Examples/Sub-charts/Test) — vô hại.

⚠ Script **không bao giờ gán `none`** (không cắt mất quyền XEM), không đụng group khác, và gửi đúng `revision`
để Metabase tự chặn ghi đè xung đột. Collection `root` **ngoài phạm vi siết** — báo cáo nằm thẳng ở root vẫn
ai cũng sửa được ở lớp 1.

## Lớp 2 — `assertOwned` trong plugin

Chặn sớm để báo lỗi tử tế bằng tiếng Việt, và tránh lỡ tay. `report.mjs` là nơi **duy nhất** gọi POST/PUT.

- Phạm vi ghi = cây con personal collection (`isMine`: so khớp NGUYÊN đoạn của `location`, không `startsWith` —
  nếu không thì `#1080` lọt vào cây của `#108`).
- Sửa/archive: bắt buộc `creator_id === myUserId` **và** đúng cây thư mục.
- Không có `DELETE` ở đâu cả — gỡ báo cáo = `archived:true` (vào Thùng rác, khôi phục được).
- `updateCard` có **allowlist trường `patch`** + kiểm collection **ĐÍCH**, không chỉ nguồn
  (xem [[gotcha-patch-thoat-thu-muc]]).
- `getEntity` (đọc) **cố ý KHÔNG qua guard** — spec: đọc thì tự do, chỉ ghi mới bị nhốt. Nhưng có allowlist
  `{card, dashboard}` để không thành proxy GET vào mọi `/api/*`.

## Vì sao lớp 2 KHÔNG đủ

Token phiên Metabase (14 ngày) nằm ở `~/.xleader-cwi/session.json`. Trên chính máy đó, Claude Code có Bash và
Read — một lượt bất kỳ đọc file rồi gọi thẳng `PUT /api/dashboard/<id>` là **vượt hoàn toàn `assertOwned`**,
vì guard không nằm trên đường đi đó.

⇒ **Lớp 1 không phải phần bổ sung, nó là toàn bộ cơ chế.** Chừng nào prod chưa siết, câu "báo cáo chung không
sửa được" vẫn là lời hứa phụ thuộc plugin cư xử đúng. README đã ghi đúng trạng thái này — đừng sửa nó thành
lời khẳng định cho tới khi prod đã siết thật.

## Cách chứng minh guardrail còn sống

```bash
MB_USER=<admin> MB_PASS=<mk> node scripts/smoke-guardrail.mjs      # mặc định localhost
```
Kỳ vọng: `cá nhân=ĐƯỢC · chung=CHẶN` + `✓ Guardrail lớp 1 ĐANG HOẠT ĐỘNG`.

⚠ Script này **TẠO USER THẬT** nên ngoài localhost bắt buộc cờ `--toi-hieu-day-la-prod`. Mật khẩu tài khoản
thử sinh ngẫu nhiên mỗi lần chạy — **đừng bao giờ hardcode lại**: file này được publish, chuỗi cố định nghĩa là
ai đọc repo cũng biết mật khẩu của tài khoản mà nó tạo.

Dọn sau khi chạy: archive collection `smoke-*`, vô hiệu hoá user `cwi.smoke@xleaders.local`.
