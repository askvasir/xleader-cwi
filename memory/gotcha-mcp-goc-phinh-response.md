---
name: gotcha-mcp-goc-phinh-response
description: MCP gốc của Metabase trả response rất tốn token — số đo thật, và cách né (viết phẳng SQL, tránh read_resource, ép ::text cho enum)
type: experience
---

Server `insight` (remote MCP gốc do Metabase host) không nén response cho mục đích tiết kiệm token — mỗi lời
gọi trả nguyên cấu trúc nội bộ của Metabase. Số đo thật 24/08:

- Một truy vấn **1 dòng × 2 cột** đã tốn **~700 token**, vì mỗi cột bị trả HAI lần: một lần trong
  `results_metadata` (kèm `fingerprint` thống kê chi tiết) và một lần trong `cols`. Mỗi cột tốn riêng
  ~100–150 token chỉ để mô tả.
- Câu SQL gốc bị **echo lại HAI lần** trong response: `json_query.native.query` và `native_form.query`. Câu
  SQL 1.000 ký tự tốn 2.000 ký tự chỉ để vọng lại — viết SQL một dòng, alias ngắn, bỏ khoảng trắng thừa.
- `read_resource` trên MỘT bảng trả về **158.288 ký tự**. Không bao giờ dùng để tra cấu trúc bảng — dùng
  `information_schema` + `string_agg` (câu mẫu ở `plugin/knowledge/index.md`).
- Một câu SQL **lỗi** tốn **~20.000 token** cho response báo lỗi. Viết đúng ngay lần đầu quan trọng hơn thử-sai:
  ghi đủ `"<schema>"."<bảng>"`, lọc `"deletedAt" is null`, một câu lệnh mỗi lần.

## CTE có thể gãy — không phải luôn gãy

Qua đường server `insight` thật, middleware `apply_workspace_sql_remapping` của Metabase từng viết lại một
câu `with … as (…)` (CTE) và gãy với lỗi `column "v" does not exist` — không phải lỗi cú pháp của câu SQL
gốc. **Cùng một câu CTE khác hình dạng vẫn chạy được** qua đường khác (đã xác nhận qua connector claude.ai) —
đây là bẫy của middleware remap, không phải giới hạn cú pháp CTE nói chung. Ghi đúng mức độ: CTE **có thể**
gãy qua đường MCP gốc, không phải "luôn gãy". Ưu tiên viết phẳng (subquery lồng trong `FROM`/`JOIN`) khi viết
SQL cho đường này để tránh rủi ro, nhưng đừng khẳng định CTE không dùng được ở nơi khác.

## Nhãn enum có tiền tố

Các nhãn tầng phễu là `LEAD_C4`, `LEAD_C41` (KHÔNG phải `C4`/`C41` trần). So sánh sai nhãn gây lỗi cứng
`invalid input value for enum`, rơi vào đúng trường hợp "câu lỗi ~20.000 token" ở trên. Chưa chắc nhãn thì ép
`::text` trước khi so sánh, hoặc tra giá trị enum thật bằng `information_schema`/`pg_enum` trước khi viết
điều kiện lọc.
