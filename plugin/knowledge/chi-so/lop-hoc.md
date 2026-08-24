# Lớp học

> ⚠ Con số trong dòng đối soát dưới đây là ẢNH CHỤP tại thời điểm đối chứng, KHÔNG phải số hiện tại — dữ
> liệu đổi hằng giờ. Muốn có số thật thì luôn chạy lại câu SQL. Tuyệt đối không trích số trong tài liệu này
> ra trả lời.

Cách tính: sĩ số CHÍNH THỨC (`trangThai = 'CHINH_THUC'`) theo từng lớp, sắp theo ngày tổ chức gần nhất.
Model "Lớp học (Buổi đào tạo)" không có sẵn cột "sĩ số chỉ tính chính thức" theo từng lớp nên đối soát ở
mức TỔNG hệ thống, qua 2 đường độc lập.

```sql
select c."maLopHoc", k."tenKhoaHoc", c."ngayToChuc", c."siSoMucTieu",
       count(e.id) filter (where e."trangThai" = 'CHINH_THUC')::int as si_so_chinh_thuc
  from "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_class" c
  left join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_course"     k on k.id = c."khoaHocId"  and k."deletedAt" is null
  left join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_enrollment" e on e."lopHocId" = c.id   and e."deletedAt" is null
 where c."deletedAt" is null
 group by 1, 2, 3, 4
 order by c."ngayToChuc" desc nulls last
 limit 50
```

Đã đối chứng CÔNG THỨC với Model "Lớp học (Buổi đào tạo)" ngày 2026-08-24 — hai đường cho cùng một kết quả:
(a) tổng "Doanh thu net (VND)" cộng dồn qua toàn bộ 197 lớp (cùng công thức Model dùng, nối qua
`_enrollment."dongDonId"`), khi đó 53.582.870.000 ở cả hai đường — xác nhận cấu trúc join theo từng lớp ở
SQL trên là đúng; (b) tổng sĩ số chính thức cộng dồn qua 197 lớp, khi đó 5.066 ở cả hai đường, khớp đúng con
số cùng thời điểm ở `chi-so/ghi-danh.md`.

## Bẫy của chỉ số này

- **"Ghi danh chính thức" = `_enrollment."trangThai" = 'CHINH_THUC'`.** TUYỆT ĐỐI không được suy ra từ
  `opportunity."phanLoaiLead"`. Ca lỗi thật: suy từ cơ hội đã làm **mất 390 trên 5013 ghi danh, trải trên
  89/178 lớp**; lớp `AIO.0001.K06` mất 50/50 = mất trắng 100%.
- **Có lớp thiếu ngày tổ chức** (`_class."ngayToChuc"` NULL) — riêng lớp `AIO.0001.K06` có 54 ghi danh —
  nên **không rơi vào bất kỳ khoảng lọc thời gian nào**. Khi câu hỏi lọc theo kỳ (tháng/quý/năm), phải
  nhắc điều này nếu số liệu có khả năng bỏ sót các lớp dạng đó.
- Doanh thu của một lớp phải nối qua `_orderItem` (và, khi so khớp Model, qua `_enrollment."dongDonId"`)
  chứ không suy trực tiếp từ sĩ số — dùng mốc `_class."ngayToChuc"` để ghi nhận theo kỳ, không dùng ngày
  chuyển tiền.
