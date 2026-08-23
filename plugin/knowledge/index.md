# Mục lục dữ liệu XLeaders (định hướng nhanh)

## Đích Metabase

`database_id = 2`, schema `workspace_6ytci89jf3kflsl9aaaxrr5hw`. Tự kiểm:

```sql
select current_database(), table_schema from information_schema.tables
 where table_schema like 'workspace%' limit 1
```

## Bảng gốc (khi Model không đủ, ghi đủ `"<schema>"."<bảng>"`)

- `_class` lớp học
- `_course` khoá học
- `_order` đơn hàng
- `_orderItem` dòng đơn hàng
- `_payment` thanh toán
- `_enrollment` ghi danh
- `_salesPolicy` chính sách bán hàng
- `opportunity` cơ hội/lead
- `person` người
- `company` công ty

## Tra cấu trúc rẻ

Đừng `select *` / `read_resource`. Gộp cột qua `string_agg`, chỉ xin bảng cần dùng:

```sql
select table_name, string_agg(column_name, ' · ' order by ordinal_position) as cols
  from information_schema.columns
 where table_schema = 'workspace_6ytci89jf3kflsl9aaaxrr5hw' and table_name in ('_orderItem','_order')
 group by 1
```

## Hỏi về X → đọc file nào

- Doanh thu → `chi-so/doanh-thu.md`
- Số vé bán → `chi-so/so-ve.md`
- Ghi danh / sĩ số / học viên → `chi-so/ghi-danh.md`
- Lead / phễu / nguồn cơ hội → `chi-so/co-hoi-tang-pheu.md`
- Lớp học / lịch / giảng viên → `chi-so/lop-hoc.md`
- Công ty đối tác doanh nghiệp → `chi-so/doi-tac-doanh-nghiep.md`
- Quy tắc chung, khoảng trống dữ liệu → `quy-tac-chung.md`
- Lệch sổ sách, doanh số quy cho Sale → `chua-chot.md`
