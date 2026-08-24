# ⚠ CHƯA CHỐT: doanh thu tính theo "có đơn hàng" hay "cơ hội đã chốt"?

⚠ Con số cụ thể trong file này là VÍ DỤ ĐO TẠI MỘT THỜI ĐIỂM khi phát hiện lỗi/khác biệt — không phải số
liệu hiện tại. Cần số THẬT thì luôn TRUY VẤN lại.

**Phát hiện quan trọng khi đối soát (24/08):** cột `opportunity."phanLoaiLead"` (tầng phễu C4/C41 = "đã
chốt") và việc `_orderItem` có `donHangId` (có đơn hàng) là HAI điều kiện GẦN NHƯ nhưng KHÔNG HOÀN TOÀN
giống nhau — hệ thống hiện có 356 dòng `_orderItem` có đơn hàng thật nhưng cơ hội chưa/không còn ở tầng
C4/C41. Model chính thức "Dòng đơn hàng (Vé)" dùng điều kiện **tầng phễu C4/C41**, không phải "có đơn
hàng", để định nghĩa doanh thu — SQL chuẩn trong `chi-so/doanh-thu.md` và `chi-so/so-ve.md` theo đúng Model
(chênh lệch giữa 2 cách tính là ~4,25 tỷ đồng trên tổng doanh thu, đo ngày 24/08).

Hai định nghĩa đang cùng tồn tại, chênh **4,25 tỷ** trên tổng doanh thu:

| Cách tính | Doanh thu NET |
|---|---|
| Có đơn hàng thật (quy tắc #1 ở `quy-tac-chung.md`) | 57.691.770.000 |
| Cơ hội đã chốt — tầng LEAD_C4/LEAD_C41 (Model + 6 dashboard chính thức) | 53.439.410.000 |

Chênh lệch nằm ở những **đơn hàng CÓ THẬT nhưng cơ hội chưa lên chốt**, đo ngày 24/08:
LEAD_C3 3.994.420.000 · LEAD_C1 165.900.000 · LEAD_C2 66.000.000 · LEAD_C31 27.000.000 ·
không gắn cơ hội −960.000.

**SQL chuẩn trong `chi-so/*.md` theo cách thứ hai (C4/C41)** để plugin nói cùng con số với dashboard công ty
đang dùng hằng ngày.

**Bắt buộc:** khi trả lời câu hỏi về tổng doanh thu công ty/kỳ, phải nói rõ *"tính theo đơn đã chốt"*.
Nếu người dùng hỏi vì sao lệch với sổ sách, hoặc hỏi doanh thu theo đơn đã ký, thì nêu cả hai con số và
nói thẳng là quy ước này chưa được chốt. Không tự đổi cách tính giữa chừng.
