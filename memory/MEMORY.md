# xleader-cwi Memory Index

> Always loaded. Scan the relevant section, then open only the file(s) you need.
> Memory describes **current state** only — no histories, no fix narratives.
> Update freely: when reality diverges, fix the file silently. New file → add a line here.

> 🔴 **Quyền collection dùng chung trên prod chưa siết.** Nhân viên thường vẫn ghi được vào collection dùng
> chung trên `insight.xteam.edu.vn` (đo: HTTP 200) — lỗ hổng có sẵn từ trước, không do plugin sinh ra, và
> chốt chặn đúng nằm ở quyền collection phía Metabase chứ không phải trong plugin (plugin không còn code).
> → [quyen-collection-con-ho](quyen-collection-con-ho.md)

> ⚠ **KHÔNG push repo `xleaders-crm-app`.** Mật khẩu admin Metabase **production** nằm plaintext trong 7+ file
> đã commit từ lâu ở repo đó (`metabase/bootstrap-prod.sh`, `build-*.mjs`, `verify-cards.mjs`) và vẫn còn hiệu
> lực. Repo đó chưa có remote nên chưa rò. Repo `xleader-cwi` **đã kiểm: lịch sử sạch**, an toàn để push.

> 📦 Phát hành: `github.com/askvasir/xleader-cwi` (**private**), `main`. Bump version ở **CẢ HAI** manifest
> rồi push thì máy người dùng tự cập nhật. Nghiệm thu trước phát hành = `nghiem-thu.md` ở gốc repo (7 phép
> kiểm tay, không còn test tự động).

## Foundation (always-needed bootstrap)

| Topic | File |
|---|---|
| Kiến trúc: plugin 0 dòng code, remote MCP gốc, OAuth 2.1 per-user, cấu trúc `knowledge/` cắt lát, vòng lặp dev, cách cài | [kien-truc-plugin](kien-truc-plugin.md) |
| Quyền collection dùng chung trên prod chưa siết — hiện trạng, chốt chặn đúng nằm ở đâu, cách siết lại | [quyen-collection-con-ho](quyen-collection-con-ho.md) |
| Hai câu hỏi nghiệp vụ chưa chốt (định nghĩa doanh thu, quy kết doanh số cho Sale) kèm số đo chênh lệch thật | [chua-chot-nghiep-vu](chua-chot-nghiep-vu.md) |

## Experiences (gotchas + recipes learned from real interaction)

| Topic | File |
|---|---|
| ⚠ Mọi SQL phải ghi đủ `"<schema>"."<bảng>"` — tên trần luôn lỗi. Từ v0.2 đây là đường ghi/đọc DUY NHẤT của plugin nên quên schema vô hiệu cả cơ chế đối soát số | [gotcha-sql-phai-ghi-schema](gotcha-sql-phai-ghi-schema.md) |
| MCP gốc của Metabase phình response rất tốn token (số đo thật) + CTE có thể gãy qua middleware remap + nhãn enum có tiền tố `LEAD_*` | [gotcha-mcp-goc-phinh-response](gotcha-mcp-goc-phinh-response.md) |
| ⚠ MCP **không tạo/đọc/sửa được bộ lọc dashboard** và trường thừa bị bỏ im lặng (thành công giả) — kèm đường vòng đã chốt và 4 phương án đã loại, đừng đề xuất lại | [gotcha-mcp-khong-tao-duoc-filter](gotcha-mcp-khong-tao-duoc-filter.md) |
| Chứng minh trả SỐ ĐÚNG chứ không chỉ CHẠY ĐƯỢC: bất biến Model↔SQL qua `execute_question`/`execute_sql`, 7 quy tắc nghiệp vụ đã đo lại, và các bẫy làm số sai trong im lặng | [recipe-doi-soat-so-lieu](recipe-doi-soat-so-lieu.md) |

## Liên quan ở repo khác

- Skill `/build-metabase-report` (`~/project/xleaders-crm-app/.claude/skills/build-metabase-report/`) có mục
  liên quan tới nạp lại tri thức plugin khi schema đổi.
- `~/project/xleaders-crm-app/memory/recipe-metabase-local.md` — nguồn sự thật về Metabase, mapping
  field→cột, và lịch sử các lỗi số liệu đã trả giá. `plugin/knowledge/quy-tac-chung.md` chắt từ đó.
- Spec + kế hoạch triển khai: `~/project/xleaders-crm-app/docs/superpowers/{specs,plans}/2026-08-10-xleader-cwi*`
  (kiến trúc gốc) và `docs/superpowers/{specs,plans}/2026-08-24-tinh-gon-v02*` trong chính repo này (refactor
  v0.2 — plugin 0 dòng code).
