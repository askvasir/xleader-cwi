# Doanh thu NET (chưa VAT)

Cách tính: tiền vé đã bán, chưa VAT, tính theo ngày lớp khai giảng, chỉ tính dòng đơn ở cơ hội đã "chốt"
(tầng phễu C4 hoặc C41).

```sql
select date_trunc('month', c."ngayToChuc")::date as thang,
       round(sum(oi."thanhTienAmountMicros" / (1 + coalesce(oi."vat", 0)) / 1e6)) as doanh_thu_net
  from "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_orderItem" oi
  join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_order"      o  on o.id = oi."donHangId"  and o."deletedAt" is null
  join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_class"      c  on c.id = oi."lopHocId"   and c."deletedAt" is null
  join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."opportunity" op on op.id = oi."coHoiId"   and op."deletedAt" is null
 where oi."deletedAt" is null
   and op."phanLoaiLead" in ('LEAD_C4', 'LEAD_C41')
 group by 1
 order by 1
```

Đã đối soát với Model "Dòng đơn hàng (Vé)" (câu hỏi tổng hợp "Doanh thu thực tế (net)") ngày 2026-08-24:
53.439.410.000 = 53.439.410.000.

## Bẫy của chỉ số này

- **BẮT BUỘC `INNER JOIN _order`**: khoảng 17.000 dòng `_orderItem` không gắn đơn hàng nào — đó là dòng
  Sale gắn tạm một lead vào một lớp mục tiêu (trước khi có đơn), **không phải doanh thu**. Bỏ join này là
  thổi doanh thu lên gấp nhiều lần.
- **Mốc ghi nhận doanh thu = `_class."ngayToChuc"`** (ngày tổ chức lớp), không phải ngày khách chuyển tiền.
  Nếu người dùng muốn tính theo ngày thu tiền thì phải hỏi rõ và dùng `_payment."ngayChuyenKhoan"` thay vào.
- **`company."createdAt"` = ngày import dữ liệu vào CRM** (gần như toàn bộ đều là một tháng) ⇒ cột này
  **vô dụng để cắt kỳ theo thời gian**, kể cả khi câu hỏi nghe như đang hỏi về công ty theo thời gian.

⚠ Số này tính theo đơn ĐÃ CHỐT (tầng LEAD_C4/LEAD_C41). Khi trả lời phải nói rõ điều đó. Người dùng thắc
mắc lệch sổ sách → đọc chua-chot.md.
