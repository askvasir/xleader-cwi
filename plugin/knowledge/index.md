# Mục lục dữ liệu XLeaders (định hướng nhanh)

## Đích Metabase

`database_id = 2`, schema `workspace_6ytci89jf3kflsl9aaaxrr5hw`. Tự kiểm đầu phiên nếu nghi ngờ đã đổi:

```sql
select current_database(), table_schema
  from information_schema.tables
 where table_schema like 'workspace%'
 limit 1
```

## Bảng gốc (chỉ dùng khi Model không đủ, ví dụ cần tỉ lệ giữa các dòng hoặc lọc kỳ gộp)

⚠ Viết SQL trên bảng gốc: MỌI bảng phải ghi đủ `"<schema>"."<bảng>"` — tên bảng trần (vd `"_class"` một mình)
báo lỗi `relation does not exist`.

`_class` lớp học · `_course` khoá học · `_order` đơn hàng · `_orderItem` dòng đơn hàng (TIỀN nằm ở đây) ·
`_payment` thanh toán · `_enrollment` ghi danh · `_salesPolicy` chính sách bán hàng ·
`opportunity` cơ hội/lead · `person` người · `company` công ty

## Cách tra cấu trúc rẻ

Đừng `select *`, đừng gọi `read_resource` lên bảng dữ liệu (một bảng có thể trả về hơn 150.000 ký tự — mỗi
cột tốn ~100–150 token và bị trả HAI lần). Tra cấu trúc bằng một câu `information_schema` gộp cột qua
`string_agg` — chỉ tốn 2 cột × số bảng thay vì hàng trăm dòng:

```sql
select table_name, string_agg(column_name, ' · ' order by ordinal_position) as cols
  from information_schema.columns
 where table_schema = 'workspace_6ytci89jf3kflsl9aaaxrr5hw'
   and table_name in ('_orderItem','_order','_class','_enrollment','opportunity','_payment','company','person','_course')
 group by 1
 order by 1
```

Chỉ xin đúng những bảng cần dùng trong mệnh đề `in (...)`, đừng xin tất cả 10 bảng nếu câu hỏi chỉ đụng 2-3
bảng.

## Ba cạm bẫy hay gặp nhất khi viết SQL trên bảng gốc

1. Tính doanh thu phải `INNER JOIN _order` — ~17k dòng `_orderItem` không gắn đơn hàng KHÔNG phải doanh thu.
2. "Ghi danh chính thức" đọc từ `_enrollment."trangThai"`, KHÔNG được suy ra từ cơ hội.
3. Phân loại Kênh phải có nhánh riêng cho `nguon is null` (rơi vào "Nguồn chưa rõ", không phải "miễn phí").

Chi tiết đầy đủ + lý do + ca lỗi thật, cùng 7 khối SQL đã đối soát với Model cho các chỉ số lõi:
`business-rules.md`.

## 7 Model dùng chung — đường ĐỐI CHỨNG, không phải đường chạy

Đây KHÔNG còn là nơi trả lời câu hỏi trực tiếp — dùng SQL trên bảng gốc (xem `business-rules.md`) để trả lời
người dùng. Model chỉ dùng để ĐẾM LẠI, chứng minh một con số khi cần đối soát: gọi `execute_question` với id
Model (tìm id bằng `search`). ⚠ Một số Model có hơn 2.000 dòng gốc (vd `opportunity` × lớp đã gắn) — khi đó
`execute_question` bị cắt ở 2.000 dòng đầu và KHÔNG dùng để lấy số tổng được; tìm câu hỏi tổng hợp (aggregate)
đã lưu sẵn trên Model đó thay vào (`search` theo tên chỉ số), hoặc đọc định nghĩa Model bằng `read_resource`
rồi tự viết `execute_sql` tương đương.

| Model | 1 dòng = | Dùng khi cần đối chứng |
|---|---|---|
| `Cơ hội (Lead)` | 1 cơ hội × lớp đã gắn | lead, phễu, nguồn, Sale, công nợ |
| `Cơ hội theo tầng phễu` | 1 cơ hội × tầng đã đạt × lớp đã gắn | phễu cộng dồn C1≥C2≥C3≥C4 |
| `Dòng đơn hàng (Vé)` | 1 dòng đơn hàng | doanh thu, số vé, chiết khấu, VAT |
| `Thanh toán` | 1 lần thanh toán | tiền thực thu, xác nhận kế toán |
| `Ghi danh (HV theo lớp)` | 1 ghi danh | học viên, sĩ số, công ty, tình trạng học |
| `Lớp học (Buổi đào tạo)` | 1 lớp | lịch, giảng viên, sĩ số, doanh thu lớp |
| `Đối tác doanh nghiệp` | 1 công ty có học viên | số HV, lượt, doanh thu theo doanh nghiệp |
