# Mục lục dữ liệu XLeaders (định hướng nhanh — chi tiết cột xin qua `cwi_dict`)

## 7 Model dùng chung — ƯU TIÊN dùng những cái này thay vì viết SQL từ bảng gốc

| Model | 1 dòng = | Dùng khi hỏi về |
|---|---|---|
| `Cơ hội (Lead)` | 1 cơ hội × lớp đã gắn | lead, phễu, nguồn, Sale, công nợ |
| `Cơ hội theo tầng phễu` | 1 cơ hội × tầng đã đạt | phễu cộng dồn C1≥C2≥C3≥C4 |
| `Dòng đơn hàng (Vé)` | 1 dòng đơn hàng | doanh thu, số vé, chiết khấu, VAT |
| `Thanh toán` | 1 lần thanh toán | tiền thực thu, xác nhận kế toán |
| `Ghi danh (HV theo lớp)` | 1 ghi danh | học viên, sĩ số, công ty, tình trạng học |
| `Lớp học (Buổi đào tạo)` | 1 lớp | lịch, giảng viên, sĩ số, doanh thu lớp |
| `Đối tác doanh nghiệp` | 1 công ty có học viên | số HV, lượt, doanh thu theo doanh nghiệp |

## Bảng gốc (chỉ dùng khi Model không đủ, ví dụ cần tỉ lệ giữa các dòng hoặc lọc kỳ gộp)
⚠ Viết SQL trên bảng gốc: MỌI bảng phải ghi đủ `"<schema>"."<bảng>"` — tên bảng trần (vd `"_class"` một mình)
báo lỗi `relation does not exist`. Tên schema hiện tại lấy bằng `cwi_dict {list:true}` (khoá `schema`).

`_class` lớp học · `_course` khoá học · `_order` đơn hàng · `_orderItem` dòng đơn hàng (TIỀN nằm ở đây) ·
`_payment` thanh toán · `_enrollment` ghi danh · `_salesPolicy` chính sách bán hàng ·
`opportunity` cơ hội/lead · `person` người · `company` công ty

## Ba cạm bẫy hay gặp nhất khi viết SQL trên bảng gốc
1. Tính doanh thu phải `INNER JOIN _order` — ~17k dòng `_orderItem` không gắn đơn hàng KHÔNG phải doanh thu.
2. "Ghi danh chính thức" đọc từ `_enrollment."trangThai"`, KHÔNG được suy ra từ cơ hội.
3. Phân loại Kênh phải có nhánh riêng cho `nguon is null` (rơi vào "Nguồn chưa rõ", không phải "miễn phí").

Chi tiết đầy đủ + lý do + ca lỗi thật: `business-rules.md`. Cột cụ thể của một bảng: gọi
`cwi_dict {tables:[...]}` — chỉ xin đúng bảng cần dùng, đừng xin tất cả.
