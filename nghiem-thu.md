# Nghiệm thu trước mỗi lần phát hành xleader-cwi

Repo này không có test tự động — plugin không có dòng code nào, toàn bộ năng lực kỹ thuật đến từ MCP gốc của
Metabase (`plugin/.mcp.json`, server `insight`). Bảy phép kiểm dưới đây chạy tay, khoảng 5-10 phút, trong một
phiên Claude Code đã cài plugin từ nhánh/commit đang xét. Không xanh đủ bảy thì KHÔNG bump version.

Mỗi phép cần **duyệt OAuth thật** (bấm Authenticate ở `/mcp`) và/hoặc gõ câu hỏi thật cho model trả lời —
không tự động hoá được, phải có người bấm.

| # | Phép kiểm | Cách làm | Đạt khi |
|---|---|---|---|
| 1 | Kết nối MCP | Cài plugin sạch (hoặc reload nếu đang sửa tại chỗ), gõ `/mcp` | Dòng `insight` hiện ra, bấm `Authenticate` mở được trang đăng nhập insight.xteam.edu.vn và trả về `connected` |
| 2 | Truy vấn chỉ đọc chạy được | Gọi `execute_sql` server `insight` với `{"database_id": 2, "sql": "select 1 as x"}` | Trả `status: completed`, `rows: [[1]]` |
| 3 | Tra cấu trúc bảng bằng đường rẻ | Chạy câu `information_schema` + `string_agg` in trong `plugin/knowledge/index.md` (mục "Tra cấu trúc rẻ") cho 1-2 bảng | Trả về đúng danh sách cột, tốn dưới 1.000 token — KHÔNG dùng `read_resource` (một bảng trả ~158.000 ký tự) |
| 4 | Trả lời câu hỏi số liệu thường | Gõ: *"Tháng này có bao nhiêu học viên ghi danh chính thức?"* | Có một con số, kèm dòng **"Cách tính:"** bằng tiếng Việt thường, không lộ tên bảng/tên cột/SQL trong câu trả lời |
| 5 | Chặn đúng câu hỏi quy kết Sale chưa chốt | Gõ: *"Phương Anh tháng rồi bán được bao nhiêu?"* | Model **hỏi lại** người dùng muốn quy kết theo `opportunity.sale` hay theo người tạo đơn — KHÔNG tự chọn rồi trả thẳng một con số |
| 6 | Dựng và gỡ một thẻ | Yêu cầu dựng một báo cáo đơn giản (vd đếm lớp học), xác nhận thẻ được tạo trong **thư mục cá nhân**, mở xem đúng số, rồi yêu cầu gỡ | Thẻ hiển thị đúng số khi mở, `archived: true` thành công (vào Thùng rác, không mất) |
| 7 | Đối soát chéo một chỉ số | Lấy một khối SQL chuẩn trong `plugin/knowledge/chi-so/*.md`, chạy `execute_sql`, rồi tìm Model tương ứng qua `search` và chạy `execute_question` trên Model đó (xem bảng đối chiếu ở `plugin/knowledge/doi-soat.md`) | Hai con số khớp nhau |

## Phép 7 lệch nghĩa là gì

Dữ liệu hoặc Model phía Metabase đã đổi so với lúc SQL trong `chi-so/*.md` được đối soát lần đầu. **Dừng phát
hành**, đối soát lại theo `memory/recipe-doi-soat-so-lieu.md`, sửa SQL chuẩn trong `chi-so/*.md` cho khớp lại
với Model rồi mới tiếp tục.

## Sau khi cả bảy phép đạt

Bump version ở **cả hai** manifest (`.claude-plugin/marketplace.json` và `plugin/.claude-plugin/plugin.json`)
mới phát hành.

## Trạng thái hiện tại — ĐỌC TRƯỚC KHI PHÁT HÀNH

- **Bảy phép nghiệm thu chưa từng chạy đủ lần nào** — mỗi phép cần người bấm duyệt OAuth thật, chưa ai chạy
  trọn vẹn cả bảy trong một phiên.
- **Chỉ tiêu ngân sách token của spec §7 (dưới 3.000 token cho cả hỏi lẫn đáp) đang vượt** — ước đo cuối
  3.120–3.874 token. Spec bắt buộc: vượt chỉ tiêu thì phải báo người dùng và cân nhắc lại kiến trúc,
  **không được lặng lẽ bỏ chỉ tiêu**. Phép đo thật (chạy trong một phiên Claude Code sạch, theo cách đo ở
  spec §7) chưa chạy — con số 3.120–3.874 là ước tính, chưa phải phép đo chính thức.
- **Version cố ý giữ `0.1.0` ở cả hai manifest** vì hai lý do trên — bảy phép chưa chạy đủ và chỉ tiêu token
  chưa đo thật — nên **không máy nào tự cập nhật** qua auto-update. Chỉ bump khi bảy phép xanh đủ và phép đo
  token đã chạy thật (dù kết quả là đạt, hay là vượt nhưng đã báo người dùng và quyết định đi tiếp).
- **Hợp đồng payload dashboard chưa kiểm bằng thực nghiệm** — xem mục "Hợp đồng payload dashboard" trong
  `plugin/skills/dung-bao-cao/SKILL.md`.
