---
name: chua-chot-nghiep-vu
description: Hai câu hỏi nghiệp vụ đang chờ ban điều hành chốt quy tắc — định nghĩa doanh thu và quy kết doanh số cho Sale — kèm số đo chênh lệch thật
type: foundation
---

Hai quy tắc nghiệp vụ dưới đây **chưa được ban điều hành chốt**. Plugin phải hỏi lại người dùng thay vì tự
chọn một cách tính, theo đúng nội dung `plugin/knowledge/chua-chot/*.md` mà hai skill đọc trước khi trả lời.

## Định nghĩa doanh thu: "có đơn hàng" hay "đã chốt C4/C41"?

Hai cách tính doanh thu đang cùng tồn tại, chênh lệch thật (đo 24/08):

| Cách tính | Doanh thu NET |
|---|---|
| Có đơn hàng thật (`_orderItem` có `donHangId`) | 57.691.770.000 |
| Cơ hội đã chốt — tầng `LEAD_C4`/`LEAD_C41` (Model chính thức + 6 dashboard công ty đang dùng) | 53.439.410.000 |

Chênh **4.252.360.000**, phần lớn nằm ở cơ hội đang dừng ở tầng `LEAD_C3` (có đơn hàng thật nhưng chưa/không
còn lên tầng chốt).

**Plugin hiện theo cách "đã chốt" (C4/C41)** để nói cùng con số với 6 dashboard chính thức công ty đang điều
hành hằng ngày. Khi câu hỏi đụng tới tổng doanh thu công ty/kỳ, phải nói rõ đang tính theo "đơn đã chốt"; nếu
người dùng hỏi vì sao lệch sổ sách hoặc muốn tính theo đơn đã ký, nêu cả hai con số.

## Quy kết doanh số cho Sale: theo trường `sale` hay theo người tạo đơn?

Cùng một đơn hàng có hai đáp án khác nhau cho "Sale nào phụ trách":
- `opportunity."sale"` — trường quy kết chính thức
- người tạo đơn `_order."createdByName"`

Ca thật đo được (17/08/2026): đơn `DH_260817_sang.le_001` do **Nguyễn Hằng** tạo, cơ hội do **Sàng Xuân**
tạo, nhưng `sale` gán **PHUONG_ANH**. Tuỳ cách tính, tuần đó Phương Anh có **5 vé / 77.760.000** hoặc
**4 vé / 61.560.000** — chênh 16.200.000 chỉ vì một quy ước chưa chốt.

**Plugin chưa dựng báo cáo KPI cho Sale** vì quy tắc quy kết chưa chốt. Bất kỳ câu hỏi nào đụng tới doanh
số/hiệu suất của MỘT Sale cụ thể, plugin phải hỏi lại người dùng muốn tính theo cách nào trước khi trả số —
không được tự chọn rồi trả thẳng một con số.
