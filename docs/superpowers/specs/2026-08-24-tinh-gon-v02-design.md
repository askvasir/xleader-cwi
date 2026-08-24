# Thiết kế: xleader-cwi v0.2 — tinh gọn về plugin không code

**Ngày:** 24/08/2026 · **Trạng thái:** đã duyệt thiết kế, chờ lập kế hoạch triển khai
**Nguồn yêu cầu:** `cwi-tinh-gon.md` (Định hướng tinh gọn v0.2) + quyết định của John trong phiên brainstorm 24/08.

## 1. Quyết định trung tâm

Plugin bỏ toàn bộ mã nguồn. Thay vì tự cài đặt giao thức MCP, tự bọc REST API Metabase, tự quản mật khẩu/phiên
và tự đóng gói từ điển dữ liệu, plugin chỉ còn **khai báo MCP server có sẵn của Metabase** và **chở tri thức
nghiệp vụ**.

Ba dữ kiện đo được trong phiên 24/08 dựng nên quyết định này:

1. Metabase trên `insight.xteam.edu.vn` là **v0.63.14.2**, có sẵn MCP server tại `/api/metabase-mcp`, cung cấp
   `search`, `execute_sql`, `execute_question`, `construct_query`, `read_resource`, `create_question`,
   `create_dashboard`, `update_dashboard`, `create_collection`, `create_metric`.
2. Endpoint đó xác thực bằng **OAuth 2.1 + dynamic client registration** (`/oauth/register`), chỉ nhận Bearer
   (`bearer_methods_supported: ["header"]`), và có scope riêng cho từng quyền (`agent:sql:execute`,
   `agent:dashboard:create`…). Không có cửa `X-Metabase-Session`.
3. **Claude Code đã biết nói OAuth với remote MCP** — máy dev đang chạy sẵn hai server kiểu đó
   (`atlassian`, `twenty-xleaders`) khai bằng `{"type":"http","url":…}`.

Hệ quả: mỗi nhân viên đăng nhập bằng **chính tài khoản insight của họ**, quyền trên Metabase là quyền thật của
họ, và plugin không bao giờ chạm vào mật khẩu.

**Ghi nhận khi thực thi:** Task 2b (cắt lát tri thức thành `chi-so/*.md` + `quy-tac-chung.md` + `chua-chot/*.md`
thay vì một `knowledge/business-rules.md` gộp) được chèn thêm giữa kế hoạch, sau khi đo sàn token thật cho thấy
file gộp một mình đã tốn ~4.300 token mỗi câu hỏi — vỡ trần trước khi chạm dữ liệu. Xem
`.superpowers/sdd/2026-08-24-tinh-gon-v02/task-2b-brief.md`.

## 2. Cái phải trả giá, ghi rõ để không ai tưởng là miễn phí

**a) Không còn chỗ nén response.** §3 của tài liệu định hướng đặt ngân sách token làm yêu cầu kỹ thuật chính.
Nối thẳng vào MCP gốc nghĩa là code của ta không nằm trên đường dữ liệu, nên không cắt được gì. Đo thật:

| Phép đo (24/08) | Kết quả |
|---|---|
| `select 1 as x, 'a' as y` (1 dòng × 2 cột) | ~2.600 ký tự ≈ **700 token**; dữ liệu thật 10 ký tự |
| Chi phí mỗi cột | ~100–150 token, **bị trả hai lần** (`results_metadata` + `cols`) |
| `read_resource` mô tả cột một bảng | **158.288 ký tự** (định hướng §3, đo 23/08) |
| Một câu SQL lỗi | ~20.000 token stack trace (định hướng §3, đo 23/08) |

Đối trọng: con số "hiện tại ~15.000 token" trong định hướng §3 phần lớn đến từ **đọc từ điển đóng gói + vòng lặp lỗi** —
cả hai đều bị xoá. Ước tính còn ~1.500–3.000 token cho câu hỏi nghiệm thu. **Chưa đo thì chưa biết**, nên
§7 dưới đây đặt phép đo bắt buộc và một đường lui.

**b) Mất toàn bộ 64 test tự động** cùng với code. Thay bằng checklist chạy tay (§8).

**c) Mất `cwi_health` và vân tay chống trôi schema.** Không còn snapshot thì không còn gì để lệch, nhưng cũng
không còn chốt nào bắt dừng khi dữ liệu đổi. Kỷ luật đó chuyển hẳn sang skill (đối soát chéo mỗi số KPI).

**d) Mất guardrail — theo quyết định §6 của tài liệu định hướng.** Lỗ hổng "nhân viên ghi được vào collection
dùng chung" **có sẵn từ trước**, không phải do refactor sinh ra. Nhưng plugin không còn được phép hứa điều
ngược lại với người dùng (xem §6 — Hai skill và /start).

## 3. Kiến trúc đích

```
xleader-cwi/
├── .claude-plugin/marketplace.json     giữ 0.1.0 cho tới khi 7 phép nghiệm thu + phép đo token chạy thật
├── CLAUDE.md                           viết lại
├── README.md                           viết lại (cài + duyệt OAuth)
├── nghiem-thu.md                       7 phép kiểm tay trước mỗi lần phát hành
├── docs/superpowers/specs/             tài liệu này
├── memory/                             8 file → 6 + chỉ mục
└── plugin/
    ├── .claude-plugin/plugin.json      giữ 0.1.0, đồng bộ với manifest trên
    ├── .mcp.json                       toàn bộ "hạ tầng", 6 dòng
    ├── commands/start.md
    ├── knowledge/index.md
    ├── knowledge/quy-tac-chung.md
    ├── knowledge/doi-soat.md
    ├── knowledge/chi-so/*.md           một file mỗi chỉ số lõi (6 file)
    ├── knowledge/chua-chot/*.md        câu hỏi nghiệp vụ chưa chốt (2 file)
    ├── skills/hoi-du-lieu/SKILL.md
    └── skills/dung-bao-cao/SKILL.md
```

Ghi chú thực thi: `knowledge/business-rules.md` được kế hoạch ban đầu ở đây nhưng chưa từng lên cây làm việc
— Task 2b (xem ghi nhận ở §1) cắt nó thành `chi-so/*.md` + `quy-tac-chung.md` + `chua-chot/*.md` +
`doi-soat.md` trước khi commit đầu tiên.

`plugin/.mcp.json`:

```json
{ "mcpServers": { "insight": {
  "type": "http", "url": "https://insight.xteam.edu.vn/api/metabase-mcp" } } }
```

**Xoá hẳn:** `plugin/mcp/` (9 file, ~800 dòng) · `test/` (8 file, 64 test) · `scripts/` (3 file) · `spike/`
(2 file) · `plugin/dictionary/{schema,models,fingerprint}.json` (160 KB) · `package.json`.

Chết theo: sáu tool `cwi_*`, giao thức JSON-RPC tự viết, HTTP client Metabase, guardrail hai lớp, quản lý
mật khẩu/Keychain/phiên, đường elicitation, vân tay chống trôi schema.

**Ba quyết định phụ:**

1. `scripts/siet-quyen-collection.mjs` (đã chứng minh 403/200 trên local) **xoá khỏi cây làm việc**; toạ độ
   commit ghi vào memory. Siết quyền là việc hạ tầng, làm độc lập với repo này (§6 tài liệu định hướng).
2. `plugin/dictionary/` đổi tên thành `plugin/knowledge/` — nó không còn là từ điển dữ liệu mà là tri thức
   nghiệp vụ. Tên cũ mời người sau đi tìm snapshot không còn tồn tại.
3. `database_id` và tên schema `workspace_…` ghi trong `knowledge/index.md` **kèm câu SQL một dòng để tự
   kiểm**. Chúng là ID sống chứ không phải bản sao cấu trúc, nhưng vẫn trôi được (local ≠ prod).

## 4. Tri thức: nội dung phải có

### 4.1 `knowledge/business-rules.md` (khi thực thi cắt thành `quy-tac-chung.md` + `chi-so/*.md` + `chua-chot/*.md`, xem ghi nhận Task 2b ở §1)

Giữ nguyên 10 quy tắc hiện có và mục "Khoảng trống dữ liệu". Bổ sung hai khối:

**a) SQL chuẩn cho 7 chỉ số lõi**, thay chỗ 7 Model vừa bỏ. Mỗi khối gồm: tên chỉ số · đúng một dòng
"Cách tính:" bằng tiếng Việt thường để skill chép thẳng vào câu trả lời · câu SQL đã đối soát.

Bảy chỉ số: doanh thu NET (chưa VAT) · số vé bán (`Σ soLuong`) · ghi danh chính thức · cơ hội theo tầng phễu ·
phân loại kênh · lớp học (lịch/sĩ số/doanh thu lớp) · đối tác doanh nghiệp. **Thực tế khi thực thi:** phân
loại kênh không đạt được đối soát Model↔SQL (§4.2) trong thời gian refactor nên KHÔNG có khối SQL chuẩn
riêng — chỉ còn quy tắc phân loại, chép trong `chi-so/co-hoi-tang-pheu.md`, đánh dấu rõ "chưa đối chứng".

Mọi khối phải mang sẵn ba luật sống còn: ghi đủ `"<schema>"."<bảng>"`, `INNER JOIN _order` khi tính tiền,
`"deletedAt" is null`.

**b) Định hướng §7 — quy kết doanh số cho ai — ghi vào như một câu hỏi CHƯA CHỐT.** Hai đáp án đang tồn tại trên cùng
một đơn (`opportunity.sale` vs người tạo đơn `_order.createdByName`), ca thật `DH_260817_sang.le_001` lệch
16 triệu, và tầng suy diễn từ email `picId` trong Model "Dòng đơn hàng (Vé)". Skill **phải hỏi lại** khi câu
hỏi đụng tới hiệu suất Sale; tuyệt đối không tự chọn một cách rồi trả số trôi chảy.

### 4.2 Cách giữ lời hứa "số đã đối soát" sau khi bỏ Model

7 Model vẫn nằm trên Metabase và chuyển vai: **thôi làm đường chạy, sang làm trọng tài**. Khi viết mỗi khối
SQL chuẩn ở 4.1a, chạy `execute_question` trên Model tương ứng và so số. Khớp mới được ghi vào file; lệch thì
dừng và báo người dùng. Đây là bất biến kiểu Model↔SQL của `recipe-doi-soat-so-lieu`, giữ nguyên tinh thần
"SQL chạy được ≠ số đúng".

### 4.3 `knowledge/index.md`

Định hướng nhanh: 10 bảng gốc dùng cho việc gì · `database_id` · tên schema + câu SQL tự kiểm · ba cạm bẫy hay
gặp nhất · bảng "hỏi về X → đọc file nào" trỏ sang đúng lát cắt trong `chi-so/*.md`/`quy-tac-chung.md`
(khi thực thi thay chỗ trỏ sang `business-rules.md` gộp). Bỏ bảng 7 Model với vai trò "ưu tiên dùng", thay
bằng vai trò "đường đối chứng".

## 5. Kỷ luật token (thay cho lớp nén đã bỏ)

Viết vào cả hai SKILL.md, vì giờ chỉ skill mới tác động được lên kích thước response:

1. **Cấm `read_resource` để tra cấu trúc** (158 KB/bảng). Tra bằng SQL trên `information_schema.columns`.
2. **Cấm `select *`.** Chọn cột đích danh; loại `searchVector`, `rawWebhook`, `*Blocknote`, `*Context`.
   Vì mỗi cột tốn ~100–150 token và bị trả hai lần, **cắt cột là đòn bẩy mạnh hơn cắt dòng**.
3. Luôn có `limit` (mặc định 50). Ô văn bản dài bọc `left(col, 300)`.
4. Gộp/tính ngay trong SQL thay vì kéo dữ liệu thô về rồi tính.
5. **Sai một lần tốn ~20.000 token** ⇒ viết đúng từ lần đầu: đủ schema · `"deletedAt" is null` · một câu lệnh
   mỗi lần. Gặp lỗi thì **dừng, đọc lại cấu trúc bằng `information_schema`**, không thử lại mù.

## 6. Hai skill và `/start`

**Giữ nguyên xương sống của hai skill:** hỏi lại bằng ngôn ngữ nghiệp vụ (không bao giờ hỏi "join bảng nào") ·
câu trả lời luôn đủ 3 phần với **"Cách tính:"** · không bịa định nghĩa · nói ra khoảng trống dữ liệu · đối
soát chéo mỗi số KPI bằng một đường độc lập · trùng tên thì cập nhật bản cũ chứ không tạo mới · gỡ báo cáo chỉ
bằng archive, hỏi xác nhận trước.

**Thay ruột:** mọi lời gọi `cwi_*` → tool của server `insight`; bỏ nhánh `mode:'model'`; bỏ chốt `cwi_health`
trước khi dựng báo cáo.

**Viết lại sau khi chạy thật, không chép sang:** mục "Hợp đồng payload dashboard" (id âm tạm thời,
`parameter_mappings`, `template-tags`) là hợp đồng của REST API. Qua MCP gốc, `create_question` /
`create_dashboard` / `update_dashboard` có hình dạng riêng chưa ai kiểm.

**`/start` mới** làm ba việc: (1) kiểm server `insight` đã nối chưa — chưa thì hướng dẫn `/mcp` → `insight` →
Authenticate, đăng nhập bằng chính tài khoản của họ; (2) hai lời gọi rẻ thay `cwi_health`: `select 1` và một
câu đếm bảng trên `information_schema`; (3) in 5 câu hỏi mẫu.

**Câu kết của `/start` phải sửa cho đúng sự thật.** Câu cũ hứa *"báo cáo chung của công ty em không đụng vào
được"* — sau khi bỏ guardrail thì đó là lời nói dối. Câu mới:

> Em dựng báo cáo trong thư mục riêng của anh/chị. Quyền trên insight là quyền của chính tài khoản anh/chị —
> em không mở rộng thêm được, cũng không tự siết lại được.

Skill `dung-bao-cao` mặc định tạo trong **personal collection của người dùng**, chỉ ghi ra chỗ khác khi người
dùng nói rõ.

## 7. Nghiệm thu

**Chỉ tiêu (định hướng §3):** câu *"tuần rồi Phương Anh bán bao nhiêu vé, những Opp nào"* trả lời đúng trong **dưới 3.000
token** cho cả hỏi lẫn đáp.

**Cách đo:** chạy trong một phiên Claude Code sạch; cộng ký tự của mọi lời gọi tool và mọi response, chia 4.
Đo với quy ước tạm `opportunity.sale`, ghi rõ là quy ước tạm vì định hướng §7 chưa chốt. Ghi số vào memory làm mốc.

**Đường lui:** nếu vượt 3.000 token, **báo lại người dùng** và mở lại hướng B (proxy stdio ~250 dòng tự lo
OAuth DCR+PKCE, forward `execute_sql` rồi nén theo hợp đồng §3 của tài liệu định hướng). Không lặng lẽ bỏ
chỉ tiêu.

**Ghi chú (định hướng §5):** đường SQL né được lỗi tuần lệch — `date_trunc('week')` của Postgres luôn bắt đầu Thứ Hai. Cài
đặt *first day of week* trong Metabase Admin vẫn cần đổi, nhưng chỉ ảnh hưởng dashboard, không ảnh hưởng hỏi–đáp.

**Chỗ thử GHI:** kiểm `localhost:3001` có `/api/metabase-mcp` không (cần v0.63+). Có thì học hợp đồng
`create_question`/`create_dashboard` ở đó. Không có thì **xin phép người dùng chạy đúng một lần trên prod** —
tạo trong thư mục cá nhân, tên tiền tố `[thử nghiệm]`, archive ngay sau khi học xong hợp đồng.

## 8. Kiểm chứng thay cho test tự động

`nghiem-thu.md` — 7 phép kiểm tay (~5-10 phút) chạy trước mỗi lần phát hành:

1. Cài plugin sạch → server `insight` hiện trong `/mcp` và duyệt OAuth được.
2. `select 1` chạy được.
3. Tra cấu trúc một bảng bằng `information_schema` — dưới 1.000 token.
4. Một câu hỏi thật trả lời đúng định dạng 3 phần, có "Cách tính:".
5. Chặn đúng câu hỏi quy kết Sale chưa chốt — model hỏi lại thay vì tự chọn cách quy kết rồi trả thẳng số.
6. Dựng một thẻ trong thư mục cá nhân, mở xem được, archive lại được.
7. Đối soát chéo một số KPI: SQL chuẩn ↔ Model tương ứng, hai số khớp.

## 9. Memory sau refactor (8 → 6 + chỉ mục)

| File | Số phận |
|---|---|
| `kien-truc-plugin` | **viết lại** — kiến trúc 0 dòng code, remote MCP, OAuth scope |
| `recipe-doi-soat-so-lieu` | **giữ**, sửa chỗ nhắc `cwi_query`/Model |
| `gotcha-sql-phai-ghi-schema` | **giữ** — quan trọng hơn trước, SQL là đường duy nhất |
| `quyen-collection-con-ho` (tên khi thực thi, kế hoạch ban đầu gọi `guardrail-hai-lop`) | **co lại** thành ghi chú ngắn: lỗ hổng quyền collection vẫn còn + toạ độ commit script |
| `gotcha-mcp-goc-phinh-response` | **mới** — các số đo ở §2a |
| `chua-chot-nghiep-vu` | **mới** khi thực thi — hai câu hỏi nghiệp vụ chưa chốt kèm số đo chênh lệch thật, không có trong kế hoạch ban đầu ở bảng này |
| `tu-dien-du-lieu` · `gotcha-rpc-khong-ep-tham-so` · `gotcha-patch-thoat-thu-muc` · `gotcha-moi-truong-va-metabase-api` | **xoá** — mô tả code đã chết |

## 10. `CLAUDE.md` mới — ràng buộc

1. **Plugin không có code.** Thêm bất kỳ file `.mjs` nào vào `plugin/` là quyết định kiến trúc, phải bàn lại.
2. Mọi SQL ghi đủ `"<schema>"."<bảng>"` và lọc `"deletedAt" is null`.
3. Không đóng gói snapshot cấu trúc dữ liệu vào repo.
4. Ghi lên prod phải hỏi người dùng trước, mỗi lần.
5. SQL chạy được ≠ số đúng — mọi con số công bố phải có một đường đếm độc lập.
6. Bump version ở **cả hai** manifest.

Vòng lặp phát triển đổi từ `sửa code → node --test → commit` thành
`sửa tri thức/skill → chạy thật câu hỏi mẫu → đối soát số → commit`.

## 11. Ngoài phạm vi refactor này

- Đổi *first day of week* = Monday trong Metabase Admin — quản trị Metabase.
- Đổi display name cột sang tiếng Việt trong Data Studio — tuỳ chọn, không chặn v0.2.
- Siết quyền collection phía Metabase — việc hạ tầng, làm độc lập.
- Chốt quy tắc quy kết doanh số cho Sale — **câu hỏi cho ban điều hành**, không phải cho đội phát triển.
  Chưa chốt thì chưa dựng báo cáo KPI cho Sale.
