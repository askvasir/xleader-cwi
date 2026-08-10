# Spike: MCP elicitation trong Claude Code

- Ngày chạy: 2026-08-10
- Phiên bản Claude Code: `2.1.221 (Claude Code)`
- **ELICITATION_OK = CHƯA XÁC ĐỊNH (chờ người dùng chạy Step 3)**
- Quan sát: Step 3 (mở phiên Claude Code mới, gọi tool `probe_elicit`, quan sát form native
  thật có hiện ra hay không) **chưa được thực hiện** — người thực thi task này là một subagent
  không có giao diện Claude Code và không có quyền mở phiên mới; server đăng ký bằng
  `claude mcp add` chỉ được nạp lúc khởi động phiên nên subagent cũng không thể tự kích hoạt nó.
  Việc này để người dùng tự chạy.
- Giao thức stdio tự viết: **kết nối được**, xác nhận bằng 3 phép tự kiểm độc lập bên dưới.

## Các phép tự kiểm đã chạy (thay cho Step 3, không thay thế được Step 3)

### 1. Framing giao thức JSON-RPC thô qua stdio

Lệnh:

```bash
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}' '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | node spike/elicit-probe.mjs
```

Output thật:

```
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{}},"serverInfo":{"name":"cwi-spike","version":"0.0.1"}}}
{"jsonrpc":"2.0","id":2,"result":{"tools":[{"name":"probe_elicit","description":"Thử nghiệm: xin người dùng nhập email + mật khẩu qua form native.","inputSchema":{"type":"object","properties":{},"additionalProperties":false}}]}}
```

Kết quả: `serverInfo.name` = `cwi-spike` ✓, `tools[0].name` = `probe_elicit` ✓ — đúng kỳ vọng.

### 2. `claude mcp add` + `claude mcp list`

Lệnh:

```bash
claude mcp add cwi-spike -- node "$HOME/project/xleader-cwi/spike/elicit-probe.mjs"
claude mcp list
```

Output thật (dòng liên quan):

```
Added stdio MCP server cwi-spike with command: node /Users/johnvu/project/xleader-cwi/spike/elicit-probe.mjs to local config
...
cwi-spike: node /Users/johnvu/project/xleader-cwi/spike/elicit-probe.mjs - ✔ Connected
```

Kết quả: Claude Code CLI tự spawn được server và bắt tay `initialize` thành công → giao thức
stdio tự viết (không dùng SDK npm nào) tương thích với client thật của Claude Code, không chỉ
với phép thử tự viết ở trên.

### 3. Vòng request/response hai chiều (server → client → server) cho `elicitation/create`

Vì subagent không thấy UI, phép này giả lập phía "client" bằng một script Node tạm trong
scratchpad (KHÔNG commit) lái trực tiếp stdin/stdout của tiến trình con `elicit-probe.mjs`:
gửi `initialize` → `notifications/initialized` → `tools/list` → `tools/call` (tool
`probe_elicit`), rồi khi thấy server phát ra một dòng có `"method":"elicitation/create"` và một
`id` (`srv-1`), viết tiếp vào stdin của server một dòng trả lời thủ công dạng
`{"jsonrpc":"2.0","id":"srv-1","result":{"action":"accept","content":{"email":"a@b.c","password":"123456"}}}`.

Output thật (log của script driver, thứ tự đúng như chạy):

```
[CLIENT->SERVER] {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}
[CLIENT->SERVER] {"jsonrpc":"2.0","method":"notifications/initialized"}
[CLIENT->SERVER] {"jsonrpc":"2.0","id":2,"method":"tools/list"}
[CLIENT->SERVER] {"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"probe_elicit","arguments":{}}}
[SERVER->CLIENT] {"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{}},"serverInfo":{"name":"cwi-spike","version":"0.0.1"}}}
[SERVER->CLIENT] {"jsonrpc":"2.0","id":2,"result":{"tools":[{"name":"probe_elicit","description":"Thử nghiệm: xin người dùng nhập email + mật khẩu qua form native.","inputSchema":{"type":"object","properties":{},"additionalProperties":false}}]}}
[SERVER->CLIENT] {"jsonrpc":"2.0","id":"srv-1","method":"elicitation/create","params":{"mode":"form","message":"Nhập thông tin đăng nhập insight (thử nghiệm — sẽ không được lưu)","requestedSchema":{"type":"object","properties":{"email":{"type":"string","title":"Email insight"},"password":{"type":"string","title":"Mật khẩu","format":"password"}},"required":["email","password"]}}}
[CLIENT] nhận elicitation/create, id=srv-1 — trả lời thủ công...
[SERVER->CLIENT] {"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"action=accept · nhận được email=CÓ · mật khẩu=CÓ (6 ký tự)"}]}}
[CLIENT] nhận kết quả tools/call cuối cùng, đóng lại.
EXIT CODE: 0
```

Kết quả: server đúng là dừng thực thi `callTool()` ở `await request('elicitation/create', …)`,
chờ client trả lời qua stdin (đúng cơ chế `pending` Map trong code), rồi tiếp tục và trả kết quả
`tools/call` cuối cùng với văn bản
`action=accept · nhận được email=CÓ · mật khẩu=CÓ (6 ký tự)` — khớp chính xác định dạng kỳ vọng ở
Step 3 Kỳ vọng A của brief. Điều này chứng minh **khung giao thức** (framing JSON-RPC hai chiều
qua stdio, id khớp, không lẫn giữa request server→client và client→server) là đúng.

**Giới hạn của phép tự kiểm #3:** nó chỉ chứng minh khung giao thức của SERVER đúng. Nó
**KHÔNG** chứng minh Claude Code (client THẬT) biết diễn dịch `elicitation/create` thành một
form native cho người dùng nhập — đó là phần chỉ Step 3 thật (mở phiên Claude Code mới, gọi tool,
quan sát UI) mới trả lời được. `claude mcp list` ở phép tự kiểm #2 chỉ xác nhận client kết nối và
bắt tay `initialize` được, không xác nhận capability `elicitation`.

## Hệ quả
- Nếu true  → Task 9 (`cwi_setup`) dùng `elicitation/create` chế độ `form`, mật khẩu KHÔNG đi vào transcript.
- Nếu false → Task 9 rơi xuống fallback: in một lệnh cho người dùng dán vào Terminal
  (`read -s` → `security add-generic-password`), và đọc thêm biến môi trường `CWI_MB_PASSWORD`.

**Trạng thái hiện tại: chờ người dùng tự chạy Step 3 và cập nhật `ELICITATION_OK` trong file này
trước khi Task 9 được thiết kế/triển khai.**
