# xleader-cwi Memory Index

> Always loaded. Scan the relevant section, then open only the file(s) you need.
> Memory describes **current state** only — no histories, no fix narratives.
> Update freely: when reality diverges, fix the file silently. New file → add a line here.

> 🔴 **GUARDRAIL LỚP 1 CHƯA ÁP LÊN PROD.** Trên `insight.xteam.edu.vn`, bất kỳ nhân viên nào vẫn ghi được vào
> 8 collection dùng chung (đo: user thường → HTTP **200**). Lỗ hổng này **có sẵn từ trước**, không phải plugin
> sinh ra — nhưng chừng nào chưa siết, câu "báo cáo chung không sửa được" chỉ là lời hứa phụ thuộc plugin cư
> xử đúng, vì token phiên nằm trên đĩa nên có đường gọi API vòng qua guard. Script sẵn sàng, đã chứng minh
> `403`/`200` trên local. → [guardrail-hai-lop](guardrail-hai-lop.md)

> ⚠ **Từ điển hiện sinh từ LOCAL**, chưa chạy lại với env prod. Và **`/start` chưa chạy thật đầu-cuối lần nào**
> — đường form nhập mật khẩu (`elicitation/create`) chưa ai xác nhận vẽ được form; `cwi_setup` tự rơi xuống
> đường dự phòng nên không kẹt, nhưng đường chính chưa kiểm. Cũng **chưa lần nào tạo card/dashboard thật qua
> plugin**. → [kien-truc-plugin](kien-truc-plugin.md)

> ⚠ **KHÔNG push repo `xleaders-crm-app`.** Mật khẩu admin Metabase **production** nằm plaintext trong 7+ file
> đã commit từ lâu ở repo đó (`metabase/bootstrap-prod.sh`, `build-*.mjs`, `verify-cards.mjs`) và vẫn còn hiệu
> lực. Repo đó chưa có remote nên chưa rò. Repo `xleader-cwi` **đã kiểm: lịch sử sạch**, an toàn để push.

> 📦 Phát hành: `github.com/askvasir/xleader-cwi` (**private**), `main`, tag `v0.1.0`, 64 test xanh.
> Bump version ở **CẢ HAI** manifest rồi push thì máy người dùng tự cập nhật.

## Foundation (always-needed bootstrap)

| Topic | File |
|---|---|
| Kiến trúc: 6 tool MCP, vai trò từng file, ràng buộc KHÔNG-npm, vòng lặp dev, cách cài, việc chưa hoàn tất | [kien-truc-plugin](kien-truc-plugin.md) |
| Guardrail 2 lớp: Metabase trả 403 (lớp 1, **chưa có trên prod**) + `assertOwned` (lớp 2), vì sao lớp 2 không đủ, cách chứng minh còn sống | [guardrail-hai-lop](guardrail-hai-lop.md) |
| Từ điển dữ liệu: 4 file, 3 nguồn dữ liệu, quy tắc field→cột, cắt lát 3,8%, vân tay chống trôi schema, cách sinh lại | [tu-dien-du-lieu](tu-dien-du-lieu.md) |

## Experiences (gotchas + recipes learned from real interaction)

| Topic | File |
|---|---|
| ⚠ Mọi SQL phải ghi đủ `"<schema>"."<bảng>"` — tên trần luôn lỗi. Từng là lỗi Critical vì làm **vô hiệu cả cơ chế đối soát số**, và chỉ lộ ra khi ghép các mảnh lại | [gotcha-sql-phai-ghi-schema](gotcha-sql-phai-ghi-schema.md) |
| `rpc.mjs` KHÔNG ép `inputSchema` — `required`/`enum` chỉ là mô tả. Mọi tool phải tự validate, nếu không sẽ lộ lỗi Clojure tiếng Anh, nổ `TypeError`, hoặc thành proxy GET vào mọi `/api/*` | [gotcha-rpc-khong-ep-tham-so](gotcha-rpc-khong-ep-tham-so.md) |
| Guard kiểm vị trí HIỆN TẠI mà không kiểm ĐÍCH ⇒ `patch.collection_id` đẩy thẻ ra collection dùng chung. Bất đối xứng với `createCard` nên rất khó thấy | [gotcha-patch-thoat-thu-muc](gotcha-patch-thoat-thu-muc.md) |
| Môi trường dev (`node --test` trần, không có `timeout`, env phải đặt cho đúng tiến trình) + mật khẩu/phiên (Keychain chỉ macOS, `chmod` sau khi ghi, retry đúng 401) + quirk API Metabase (`?status=all`, độ phức tạp mật khẩu, `personal_owner_id` chỉ ở thư mục gốc, `revision`) | [gotcha-moi-truong-va-metabase-api](gotcha-moi-truong-va-metabase-api.md) |
| Chứng minh trả SỐ ĐÚNG chứ không chỉ CHẠY ĐƯỢC: bất biến Model↔SQL (4974=4974), 7 quy tắc nghiệp vụ đã đo lại bằng SQL, đo toàn dân số khi khách báo lệch, và các bẫy làm số sai trong im lặng | [recipe-doi-soat-so-lieu](recipe-doi-soat-so-lieu.md) |

## Liên quan ở repo khác

- Skill `/build-metabase-report` (`~/project/xleaders-crm-app/.claude/skills/build-metabase-report/`) có mục
  **"Nạp lại plugin `xleader-cwi` khi schema đổi"** — chạy `scripts/gen-cwi-dictionary.mjs` rồi bump version.
- `~/project/xleaders-crm-app/memory/recipe-metabase-local.md` — nguồn sự thật về Metabase, mapping
  field→cột, và lịch sử các lỗi số liệu đã trả giá. `business-rules.md` của plugin chắt từ đó.
- Spec + kế hoạch triển khai: `~/project/xleaders-crm-app/docs/superpowers/{specs,plans}/2026-08-10-xleader-cwi*`.
