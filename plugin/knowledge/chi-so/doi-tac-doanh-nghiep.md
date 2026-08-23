# Đối tác doanh nghiệp

Cách tính: theo từng công ty của học viên, đếm số học viên (distinct) và số lượt ghi danh CHÍNH THỨC.

```sql
select cty."name" as cong_ty,
       count(distinct e."hocVienId")::int as so_hoc_vien,
       count(e.id)::int                   as so_luot_ghi_danh
  from "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_enrollment" e
  join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."person"  p   on p.id = e."hocVienId"  and p."deletedAt" is null
  join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."company" cty on cty.id = p."companyId" and cty."deletedAt" is null
 where e."deletedAt" is null
   and e."trangThai" = 'CHINH_THUC'
 group by 1
 order by 2 desc
 limit 50
```

Đã đối soát với Model "Đối tác doanh nghiệp" ngày 2026-08-24: số công ty 940 = 940, tổng số học viên
1.683 = 1.683 (khớp tuyệt đối). Tổng số lượt ghi danh: SQL (chỉ tính CHINH_THUC) ra 4.880, Model (tính
TẤT CẢ trạng thái ghi danh, không lọc CHINH_THUC) ra 4.883 — chênh 3, đúng bằng đúng số ghi danh
không-CHINH_THUC còn lại của hệ thống tại các công ty đó (đã xác minh riêng qua `execute_sql`), không phải
sai số đếm.

## Bẫy của chỉ số này

- **"Ghi danh chính thức" = `_enrollment."trangThai" = 'CHINH_THUC'`.** TUYỆT ĐỐI không được suy ra từ
  `opportunity."phanLoaiLead"`. SQL trên chủ động lọc CHINH_THUC nên số lượt ghi danh sẽ THẤP HƠN tổng mọi
  trạng thái ghi danh của Model gốc — đây là khác biệt có chủ đích, không phải lỗi đếm.
- **`company."createdAt"` = ngày import dữ liệu vào CRM** (gần như toàn bộ đều là một tháng) ⇒ cột này
  **vô dụng để cắt kỳ theo thời gian**, kể cả khi câu hỏi nghe như đang hỏi về công ty theo thời gian.
- Có ghi danh **chưa điền học viên** (bán vé trước, gán tên học viên sau) ⇒ "lượt ghi danh" cao hơn "số học
  viên" (theo đầu người) là **ĐÚNG nghiệp vụ**, không phải lỗi đếm trùng hay đếm thiếu.
