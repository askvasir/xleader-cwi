# Cơ hội theo tầng phễu

Cách tính: phễu CỘNG DỒN — một cơ hội đang ở tầng C4 vẫn được tính ở CẢ 4 tầng (C1≥C2≥C3≥C4), khác với
phân loại rời-từng-tầng (nháp ban đầu lệch hẳn với Model vì lý do này, đúng như cảnh báo trước khi đối
soát). Một cơ hội gắn nhiều lớp thì tính lặp lại ở mỗi lớp nó gắn — đúng theo cách Model đang hiển thị cho
TỔNG toàn hệ thống (Model không lọc "Dòng đại diện" khi hiển thị tổng theo tầng).

```sql
select t.tang, count(*)::int as so_co_hoi
  from "workspace_6ytci89jf3kflsl9aaaxrr5hw"."opportunity" o
  left join (
    select oi."coHoiId" as co_hoi_id, oi."lopHocId" as lop_hoc_id
      from "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_orderItem" oi
      join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_class" c on c.id = oi."lopHocId" and c."deletedAt" is null
     where oi."deletedAt" is null and oi."lopHocId" is not null
     group by 1, 2
  ) l on l.co_hoi_id = o.id
  cross join (values
    ('1. C1 · Lead tiềm năng',   array['LEAD_C1','LEAD_C2','LEAD_C3','LEAD_C31','LEAD_C4','LEAD_C41']),
    ('2. C2 · Quan tâm',         array['LEAD_C2','LEAD_C3','LEAD_C31','LEAD_C4','LEAD_C41']),
    ('3. C3 · Ghi danh',         array['LEAD_C3','LEAD_C31','LEAD_C4','LEAD_C41']),
    ('4. C4 · Đã chuyển khoản',  array['LEAD_C4','LEAD_C41'])
  ) as t(tang, ma_tang)
 where o."deletedAt" is null
   and o."phanLoaiLead"::text = any(t.ma_tang)
 group by 1
 order by 1
```

Đã đối soát với Model "Cơ hội theo tầng phễu" (câu hỏi "Phễu chuyển đổi (C1 → C4)") ngày 2026-08-24:
C1 22.756 = 22.756 · C2 11.365 = 11.365 · C3 5.080 = 5.080 · C4 4.712 = 4.712.

## Bẫy của chỉ số này

- **Đường nối Cơ hội → Lớp đi qua `_orderItem."coHoiId"` + `_orderItem."lopHocId"`.** KHÔNG được join qua
  `_order` — cách đó chỉ thấy cơ hội đã có đơn hàng (từ tầng C3 trở lên) và âm thầm bỏ sót toàn bộ C1/C2.
  Lưu ý: `opportunity` không còn cột `lopHocId` lẫn `donHangId` nữa (đã bỏ từ 2026-07).
- **Một cơ hội có thể mua vé cho NHIỀU lớp** (thực tế trên hệ thống: 63 cơ hội như vậy). Khi đếm cơ hội
  theo từng lớp, đừng lọc kiểu `distinct on (coHoiId)` để gán mỗi cơ hội về đúng 1 lớp — cách đó làm cơ hội
  biến mất khỏi mọi lớp còn lại của nó; lỗi thật đã làm mất 118 lượt (cơ hội × lớp) trên 18 lớp.
- Phễu là CỘNG DỒN, không phải rời-từng-tầng — đừng lọc `phanLoaiLead = 'LEAD_C1'` đúng nghĩa đen để lấy
  số C1, phải dùng mảng `any()` gồm cả các tầng cao hơn như SQL trên.
