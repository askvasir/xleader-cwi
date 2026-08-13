---
name: tu-dien-du-lieu
description: Từ điển dữ liệu của plugin — 4 file, cách sinh lại từ repo CRM, cơ chế cắt lát tiết kiệm token, và vân tay chống trôi schema
type: foundation
---

Plugin mang một **bản sao** từ điển dữ liệu để trả lời câu hỏi mà không phải dò schema mỗi lần. Từ điển sai ⇒
plugin trả **số sai trong im lặng** cho khách hàng thật.

## Bốn file trong `plugin/dictionary/`

| File | Nguồn | Nội dung |
|---|---|---|
| `schema.json` | **sinh máy** | 16 bảng · 365 cột · 51 enum. Cột từ snapshot giữ nhãn tiếng Việt + options; cột chỉ có trong DB gắn `nguon:'db'` |
| `models.json` | **sinh máy** | 7 Model Metabase: grain, cột, công dụng |
| `fingerprint.json` | **sinh máy** | vân tay `bảng→cột[]` + `bảng.cột→giá trị enum[]`, để phát hiện trôi schema |
| `business-rules.md` | **VIẾT TAY** | quy tắc nghiệp vụ — phần đắt nhất, DB không bao giờ tự khai ra |
| `index.md` | **VIẾT TAY** | mục lục ~26 dòng, nhúng vào skill |

**7 Model:** `Cơ hội (Lead)` · `Cơ hội theo tầng phễu` · `Dòng đơn hàng (Vé)` · `Thanh toán` ·
`Ghi danh (HV theo lớp)` · `Lớp học (Buổi đào tạo)` · `Đối tác doanh nghiệp`.
Collection "XLeaders – Models": prod **#13**, local **#74**. Model **tra theo TÊN lúc chạy**, không hardcode id.

## Sinh lại khi schema đổi

Script sống ở repo CRM (nơi có schema): `~/project/xleaders-crm-app/scripts/gen-cwi-dictionary.mjs`,
ghi thẳng sang `~/project/xleader-cwi/plugin/dictionary/`. Skill `/build-metabase-report` đã có mục nhắc chạy.

```bash
cd ~/project/xleaders-crm-app
MB_URL=<url> MB_USER=<admin> MB_PASS=<mk> MB_WS=<workspace_schema> \
  node scripts/gen-cwi-dictionary.mjs
git -C ~/project/xleader-cwi diff --stat
```
Kỳ vọng `✓ 16 bảng · 365 cột (108 lấy thêm từ DB) · 7 model`. Chỉ đổi `generatedAt` = không có gì thật để commit.

- **Chỉ THÊM** bảng/cột/option → an toàn, commit là xong.
- **ĐỔI TÊN / XOÁ / REMAP giá trị** → phải sửa tay `business-rules.md` **trước khi** commit, rồi bump version.

⚠ **Từ điển hiện sinh từ LOCAL.** Cần chạy lại với env **prod** để khớp dữ liệu thật.

## Ba nguồn dữ liệu, đừng bỏ sót nguồn nào

1. `schema/prod-snapshot.json` — **chỉ chứa field ta TỰ THÊM**. Field gốc Twenty (`person.nameFirstName`,
   `company.name`, `opportunity.stage/amountAmountMicros/closeDate`) **không có ở đó**.
2. `SNAP.relations` top-level — **cột khoá ngoại nằm ở đây**, không nằm trong `obj.fields` (đo: chỉ 7 field
   RELATION còn inline, trong khi có 48 quan hệ / 24 MANY_TO_ONE). Bỏ qua = mọi cột `<f>Id` biến mất im lặng.
3. `information_schema` + `pg_enum` của DB đang kết nối — bổ sung 108 cột và giá trị enum thật.

Generator **throw** nếu từ điển khai một cột mà DB không có → gãy TO lúc sinh, thay vì để plugin sinh SQL lỗi.

## Quy tắc field → cột SQL (đừng suy lại)

`CURRENCY` → `<f>AmountMicros` + `<f>CurrencyCode` (chia 1e6 ra VND) · `RELATION MANY_TO_ONE` → `<f>Id` ·
`MORPH_RELATION` → `<f>Id` (bỏ sót thì sinh cột ma `targetOrder` không tồn tại) · `RICH_TEXT` →
`<f>Blocknote` + `<f>Markdown` · `FULL_NAME` → `<f>FirstName` + `<f>LastName` · `LINKS` →
`<f>PrimaryLinkUrl` + `<f>PrimaryLinkLabel`. Object tuỳ chỉnh có tiền tố `_`; object chuẩn không.

## Cắt lát — lý do tồn tại của `cwi_dict`

Đo thật: hỏi **một** bảng trả 4.657 byte so với 123.653 byte của cả `schema.json` — **3,8%**. Trường
`relations` ở gốc file **không** bị trả kèm. Đừng "tiện tay" trả thêm; mỗi câu hỏi của khách sẽ ngốn context.

## Vân tay — chuông báo động

`cwi_health` so `fingerprint.json` với cấu trúc THẬT đọc từ `information_schema` + `pg_enum`. Lệch ⇒ skill
`dung-bao-cao` **dừng, không dựng báo cáo**. Quy tắc so: cột/giá trị **THÊM** = an toàn (`ok:true`);
**MẤT hoặc ĐỔI** = báo động.

⚠ Từng có giai đoạn cả hai vế đều truyền `enums:{}` nên nhánh enum **chưa từng chạy** dù có test xanh — đúng
kiểu "chuông báo động câm". Nếu sửa `docCauTrucThat`, phải giữ phần đọc `pg_enum`, và **đừng đoán tên type
bằng cách cắt dấu gạch dưới** (tên enum type của bảng custom-object cũng bắt đầu bằng `_`) — dùng
`pg_type.typcategory`/`typelem` để nhận diện mảng.

`models.json` **không có vân tay** — sửa cột của 7 Model trên prod mà không bump plugin thì `cwi_health`
không bắt được.
