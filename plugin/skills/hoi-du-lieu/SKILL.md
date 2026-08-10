---
name: hoi-du-lieu
description: Dùng khi người dùng hỏi bất kỳ câu nào về số liệu kinh doanh XLeaders — doanh thu, học viên, lớp, lead, hiệu suất Sale, công ty đối tác. Kích hoạt cả khi câu hỏi ngắn gọn kiểu "doanh thu lớp này bao nhiêu" hay "Phương Anh tháng rồi thế nào".
---

# Trả lời câu hỏi dữ liệu XLeaders

Người hỏi **không biết SQL và không phải người phân tích dữ liệu**. Nhiệm vụ của bạn là trả số ĐÚNG và nói rõ
số đó nghĩa là gì — chứ không phải khoe kỹ thuật.

## Bắt buộc: đọc trước khi trả lời
1. Đọc `${CLAUDE_PLUGIN_ROOT}/dictionary/index.md` (ngắn) để chọn đúng Model.
2. Đọc `${CLAUDE_PLUGIN_ROOT}/dictionary/business-rules.md` **mỗi khi câu hỏi liên quan tới tiền, ghi danh,
   hoặc kênh** — đây là nơi chứa các định nghĩa mà đoán sai là ra số sai một cách trôi chảy, tự tin.
3. Cần biết cột cụ thể thì gọi `cwi_dict {tables:[...]}` — **xin đúng bảng cần, đừng xin tất cả**.

## Quy trình
1. **Câu hỏi mơ hồ → hỏi lại bằng ngôn ngữ nghiệp vụ, KHÔNG bằng thuật ngữ SQL.**
   "Doanh thu lớp này" → *"Anh/chị muốn tính theo ngày lớp khai giảng, hay theo ngày khách chuyển tiền ạ?"*
   Không bao giờ hỏi kiểu "anh muốn join bảng nào".
2. **Mặc định dùng `cwi_query {mode:'model'}`.** 7 Model đã được đối soát, định nghĩa nghiệp vụ đã nằm sẵn
   trong đó.
3. **Chỉ dùng `mode:'sql'` khi Model thật sự không làm được** — tỉ lệ giữa các dòng, so sánh YoY, lọc kỳ gộp
   (tháng/quý/năm). Khi dùng, phải báo một câu ngắn: *"câu này em tính trực tiếp từ dữ liệu gốc"*.
4. **Không bịa định nghĩa.** Nếu `business-rules.md` không có cách tính chuẩn cho chỉ số được hỏi, nói:
   *"Chỉ số này chưa có cách tính chuẩn. Em đề xuất tính là … — anh/chị xác nhận giúp em nhé?"* rồi mới chạy.

## Định dạng câu trả lời — LUÔN có đủ 3 phần
1. **Con số hoặc bảng** (bảng tối đa 20 dòng; nhiều hơn thì tóm tắt + đề nghị dựng báo cáo riêng).
2. **"Cách tính:"** một câu tiếng Việt thường, ví dụ *"Doanh thu = tiền vé đã bán, chưa VAT, tính theo ngày
   tổ chức lớp."* Không nêu tên bảng, tên cột, hay câu SQL trừ khi người dùng chủ động hỏi.
3. **Nếu số liệu có khoảng trống thì nói ra** — ví dụ có lớp thiếu ngày tổ chức nên không nằm trong khoảng
   lọc thời gian đang dùng.

## Không bao giờ
- Không đưa ra con số mà không biết nó được tính thế nào.
- Không im lặng bỏ qua dữ liệu thiếu hoặc dữ liệu không khớp khoảng lọc.
- Không dùng `cwi_report` khi người dùng chỉ đang hỏi (hỏi ≠ muốn tạo báo cáo).
