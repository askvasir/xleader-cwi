---
name: gotcha-mcp-khong-toi-duoc-chat
description: plugin/.mcp.json chỉ có hiệu lực ở Claude Code — trong khung chat của app Claude/claude.ai kết nối insight phải là connector cấp tổ chức, và /mcp không tồn tại ở đó
type: experience
---

## Sự thật

`plugin/.mcp.json` **chỉ** được nạp ở Claude Code (terminal, VS Code/JetBrains, tab Code của app) và ở
Cowork. Trong **khung chat** của app Claude và claude.ai, skill của plugin vẫn chạy nhưng MCP khai trong
plugin **không** đi theo — bề mặt đó chỉ nhận **connector**.

Hệ quả đã gặp thật: `/start` chạy trong tab Chat, báo chưa kết nối rồi bảo người dùng "gõ `/mcp`" — lệnh đó
**không tồn tại** trong khung chat, người dùng bế tắc hoàn toàn.

Thêm một chặn nữa: trên gói **Team/Enterprise, chỉ Owner mới thêm được connector**. Nhân viên thường không
tự thêm được kể cả khi biết URL.

## Đường đúng

| Bề mặt | Kết nối tới bằng gì |
|---|---|
| Claude Code (terminal, VS Code, tab Code) | `plugin/.mcp.json` → `/mcp` → Authenticate |
| Cowork | plugin mang connector theo, cài xong app tự hỏi đăng nhập |
| Khung chat app Claude + claude.ai | **connector** khai ở Organization settings → Connectors |

Việc admin làm một lần: Organization settings → Connectors → Add → Custom → Web →
`https://insight.xteam.edu.vn/api/metabase-mcp`. Sau đó mỗi người vào Connectors bấm **Connect** và đăng
nhập tài khoản insight của mình (OAuth per-user, quyền giữ nguyên theo từng người).
Kèm Organization settings → Plugins đặt CWI *Installed by default* thì skill/tri thức cũng tự về máy.

## Tên tool đổi theo đường vào

Cùng một tool `execute_sql` mang tên đầy đủ khác nhau: `mcp__plugin_xleader-cwi_insight__execute_sql` khi
tới từ plugin, `mcp__claude_ai_*__execute_sql` khi tới từ connector. **Skill phải gọi theo năng lực, không
bám tên server** — bám tên là gãy trên nửa số máy.

## Đã loại (đừng đề xuất lại)

- **Enterprise Managed Auth** (bỏ luôn cú bấm Connect): cần IdP Okta *và* server MCP phải tự hỗ trợ —
  Metabase self-host không có.
- **`managed-mcp.json` đẩy qua MDM**: cài sẵn được cho cả fleet nhưng **độc quyền** — bật lên là chặn hết mọi
  MCP khác của người dùng. Quá nặng tay.
- **Hook tự chạy `claude mcp add`**: chỉ vá được Claude Code (nơi vốn đã tự chạy), vô dụng ở khung chat, và
  thêm mã thực thi vào plugin — trái ràng buộc "plugin không có dòng code nào".
