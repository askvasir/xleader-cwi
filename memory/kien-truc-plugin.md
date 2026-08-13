---
name: kien-truc-plugin
description: Kiến trúc plugin xleader-cwi — 6 tool MCP, vai trò từng file, ràng buộc không-npm, vòng lặp phát triển và cách cài
type: foundation
---

Plugin Claude Code cho nhân viên XLeaders (Sale, kế toán, sếp — **không biết code, không biết SQL**) hỏi dữ
liệu kinh doanh và tự dựng dashboard trên Metabase `insight.xteam.edu.vn`.

## Repo vừa là marketplace vừa là plugin

`github.com/askvasir/xleader-cwi` — **private** (từ điển mô tả cấu trúc kinh doanh + tên đội Sale).
Cài: `/plugin marketplace add askvasir/xleader-cwi` → `/plugin install xleader-cwi@xleader-cwi` → `/start`.
Người dùng phải được cấp quyền đọc repo thì lệnh đầu mới chạy.

**Phát hành = bump version ở CẢ HAI chỗ rồi push** (phải trùng nhau, nếu không auto-update không nhận):
`.claude-plugin/marketplace.json` → `plugins[0].version` · `plugin/.claude-plugin/plugin.json` → `version`.

## Ràng buộc sống còn: KHÔNG phụ thuộc npm

Plugin phân phối qua git marketplace, **máy người dùng không chạy `npm install`**. Vì vậy `plugin/mcp/*.mjs`
chỉ được import thư viện chuẩn Node. Giao thức MCP (JSON-RPC 2.0 qua stdio) **tự cài đặt** trong `rpc.mjs`
(~120 dòng) thay vì dùng `@modelcontextprotocol/sdk`. Đừng "tiện tay" thêm dependency — nó phá cách phân phối.

## Sáu tool MCP

| Tool | Việc | Ghi/đọc |
|---|---|---|
| `cwi_ping` | kiểm plugin nạp được chưa | — |
| `cwi_dict` | tra từ điển theo **lát cắt** (`tables[]` / `model` / `list:true`) | đọc file |
| `cwi_query` | truy vấn chỉ đọc: `mode:'model'` (mặc định) hoặc `mode:'sql'` | đọc DB |
| `cwi_report` | `list · get · create_card · update_card · create_dashboard · put_dashcards · archive` | **đường GHI DUY NHẤT** |
| `cwi_setup` | thiết lập lần đầu (chỉ `/start` gọi) | ghi cấu hình |
| `cwi_health` | kết nối · quyền · từ điển còn khớp DB không | đọc |

`cwi_dict {list:true}` trả `{schema, bang[], model[]}` — **`schema` là tên schema Postgres**, bắt buộc cho
`mode:'sql'` (xem [[gotcha-sql-phai-ghi-schema]]).

## Vai trò từng file

| File | Trách nhiệm | Ranh giới |
|---|---|---|
| `plugin/mcp/rpc.mjs` | giao thức MCP qua stdio | không biết gì về Metabase |
| `plugin/mcp/server.mjs` | khai báo 6 tool + `getConfig`/`connect`/`getCtx`/`docCauTrucThat` | file lớn nhất (~330 dòng) và **duy nhất không có test riêng** — cẩn thận khi sửa |
| `plugin/mcp/metabase.mjs` | HTTP client + phiên | không biết guardrail |
| `plugin/mcp/guard.mjs` | `isMine` · `assertCanCreate` · `assertCanModify` | **logic thuần, không I/O** |
| `plugin/mcp/report.mjs` | mọi lời gọi POST/PUT | gọi guard TRƯỚC khi chạm API; **không có DELETE ở đâu** |
| `plugin/mcp/query.mjs` | `assertReadOnly` · `resolveModelId` · `runModelQuery` · `runSql` | |
| `plugin/mcp/config.mjs` · `secrets.mjs` | `~/.xleader-cwi/` + Keychain | xem [[gotcha-moi-truong-va-metabase-api]] |
| `plugin/dictionary/` | tri thức dữ liệu | xem [[tu-dien-du-lieu]] |
| `plugin/skills/` · `plugin/commands/start.md` | quy trình cư xử với người dùng | |
| `scripts/siet-quyen-collection.mjs` · `smoke-guardrail.mjs` | vận hành guardrail lớp 1 | xem [[guardrail-hai-lop]] |

## Vòng lặp phát triển

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 24 >/dev/null
cd ~/project/xleader-cwi
node --test                     # TRẦN — `node --test test/` HỎNG, xem [[gotcha-moi-truong-va-metabase-api]]
# thử tool qua stdio, không cần cài plugin:
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"cwi_ping","arguments":{}}}' \
  | node plugin/mcp/server.mjs | tail -1
```

Hiện **64 test xanh**. Mặc định `server.mjs` trỏ **prod** (`MB_URL`/`MB_WS` hardcode) — khi thử phải export
biến môi trường trỏ local, và nhớ **đặt env cho chính tiến trình `node`**, không phải cho `printf` đứng trước.

## Trạng thái chưa hoàn tất

- **`/start` chưa chạy thật đầu-cuối lần nào.** Đường form nhập mật khẩu (`elicitation/create`) đã có trong
  Claude Code nhưng chưa ai xác nhận nó vẽ form thật. `cwi_setup` **tự rơi xuống** đường dự phòng nếu client
  không hỗ trợ, nên không kẹt — nhưng đường chính chưa được kiểm.
- **Chưa lần nào tạo card/dashboard thật qua plugin.** `smoke-guardrail.mjs` chỉ tạo *collection*.
- Guardrail lớp 1 **chưa áp lên prod** — xem [[guardrail-hai-lop]].
