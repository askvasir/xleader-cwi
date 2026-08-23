# Quy tắc nghiệp vụ XLeaders — đọc trước khi trả lời bất kỳ câu hỏi số liệu nào

Đúc kết từ nhiều tháng đối soát báo cáo thật (nguồn: `recipe-metabase-local.md` trong repo CRM). Mỗi quy tắc
từng gây SAI SỐ THẬT trên báo cáo — và báo cáo vẫn "chạy tốt", không báo lỗi. Đừng đoán, đọc file này.

⚠ **Mọi con số cụ thể trong file này (17.000 dòng, 4888 vé, 390 ghi danh…) là VÍ DỤ ĐO TẠI MỘT THỜI ĐIỂM
khi phát hiện lỗi — KHÔNG PHẢI số liệu hiện tại.** Chỉ giữ lại để minh hoạ mức độ nghiêm trọng của quy tắc.
Người dùng cần con số THẬT thì luôn phải TRUY VẤN (`execute_sql` / `execute_question`) — tuyệt đối không
trích số trong tài liệu này ra trả lời như thể đó là số hiện tại.

## Tiền

1. **Doanh thu NET (chưa VAT)** = `Σ _orderItem."thanhTienAmountMicros" / (1 + "vat") / 1e6`.
   ⚠ **BẮT BUỘC `INNER JOIN _order`**: khoảng 17.000 dòng `_orderItem` không gắn đơn hàng nào — đó là dòng
   Sale gắn tạm một lead vào một lớp mục tiêu (trước khi có đơn), **không phải doanh thu**. Bỏ join này là
   thổi doanh thu lên gấp nhiều lần.
2. **Số vé bán = `Σ "soLuong"`, KHÔNG phải `count(*)`.** Dòng điều chỉnh hoàn/đổi/huỷ có `soLuong` âm
   (vd `-1`); đếm dòng thay vì cộng số lượng từng cho ra 4888 vé thay vì con số đúng 4886.
3. **Mốc ghi nhận doanh thu = `_class."ngayToChuc"`** (ngày tổ chức lớp), không phải ngày khách chuyển tiền.
   Nếu người dùng muốn tính theo ngày thu tiền thì phải hỏi rõ và dùng `_payment."ngayChuyenKhoan"` thay vào.
4. **`company."createdAt"` = ngày import dữ liệu vào CRM** (gần như toàn bộ đều là một tháng) ⇒ cột này
   **vô dụng để cắt kỳ theo thời gian**, kể cả khi câu hỏi nghe như đang hỏi về công ty theo thời gian.

## SQL chuẩn cho chỉ số lõi

7 khối dưới đây đã chạy qua `execute_sql`, đối chiếu số ra với Model tương ứng qua `execute_question` (hoặc
qua định nghĩa đã lưu của câu hỏi khi câu hỏi đó có tham số — xem ghi chú từng khối), và KHỚP tuyệt đối tại
thời điểm đối soát. Coi đây là công thức THAM CHIẾU — khi viết SQL mới cho câu hỏi tương tự, xuất phát từ
đây thay vì đoán lại từ đầu. Vẫn phải tự chạy lại và đối chiếu nếu nghi ngờ số liệu đã đổi kể từ ngày đối soát.

⚠ **Phát hiện quan trọng khi đối soát (24/08):** cột `opportunity."phanLoaiLead"` (tầng phễu C4/C41 = "đã
chốt") và việc `_orderItem` có `donHangId` (có đơn hàng) là HAI điều kiện GẦN NHƯ nhưng KHÔNG HOÀN TOÀN
giống nhau — hệ thống hiện có 356 dòng `_orderItem` có đơn hàng thật nhưng cơ hội chưa/không còn ở tầng
C4/C41. Model chính thức "Dòng đơn hàng (Vé)" dùng điều kiện **tầng phễu C4/C41**, không phải "có đơn
hàng", để định nghĩa doanh thu — SQL dưới đây theo đúng Model (chênh lệch giữa 2 cách tính là ~4,25 tỷ đồng
trên tổng doanh thu, đo ngày 24/08).

### Doanh thu NET (chưa VAT)
Cách tính: tiền vé đã bán, chưa VAT, tính theo ngày lớp khai giảng, chỉ tính dòng đơn ở cơ hội đã "chốt"
(tầng phễu C4 hoặc C41).
Đã đối soát với Model "Dòng đơn hàng (Vé)" (câu hỏi tổng hợp "Doanh thu thực tế (net)") ngày 2026-08-24:
53.439.410.000 = 53.439.410.000.

```sql
select date_trunc('month', c."ngayToChuc")::date as thang,
       round(sum(oi."thanhTienAmountMicros" / (1 + coalesce(oi."vat", 0)) / 1e6)) as doanh_thu_net
  from "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_orderItem" oi
  join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_order"      o  on o.id = oi."donHangId"  and o."deletedAt" is null
  join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_class"      c  on c.id = oi."lopHocId"   and c."deletedAt" is null
  join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."opportunity" op on op.id = oi."coHoiId"   and op."deletedAt" is null
 where oi."deletedAt" is null
   and op."phanLoaiLead" in ('LEAD_C4', 'LEAD_C41')
 group by 1
 order by 1
```

### Số vé bán
Cách tính: tổng số lượng vé (`Σ soLuong`, không phải đếm dòng) trong các dòng đơn ở cơ hội đã "chốt"
(tầng phễu C4 hoặc C41).
Đã đối soát với Model "Dòng đơn hàng (Vé)" (câu hỏi "Vé đã bán (dòng đơn chốt)") ngày 2026-08-24:
4.730 = 4.730.

```sql
select sum(oi."soLuong")::int as so_ve
  from "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_orderItem" oi
  join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_order"      o  on o.id = oi."donHangId" and o."deletedAt" is null
  join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."opportunity" op on op.id = oi."coHoiId"  and op."deletedAt" is null
 where oi."deletedAt" is null
   and op."phanLoaiLead" in ('LEAD_C4', 'LEAD_C41')
```

### Ghi danh chính thức
Cách tính: đếm `_enrollment` có `trangThai = 'CHINH_THUC'`, bắt buộc join sang `_class` còn tồn tại
(`deletedAt is null`) — hệ thống hiện có đúng 1 ghi danh CHÍNH THỨC trỏ tới một lớp không còn tồn tại; bỏ
join này đếm ra 5.067 thay vì con số đúng 5.066.
Đã đối soát với Model "Ghi danh (HV theo lớp)" (định nghĩa đã lưu của câu hỏi "Số ghi danh chính thức",
đọc qua `read_resource` vì câu hỏi có tham số nên `execute_question` không chạy trực tiếp được — chạy lại
đúng công thức đó qua `execute_sql` cho ra cùng một số) ngày 2026-08-24: 5.066 = 5.066.

```sql
select count(*)::int as ghi_danh_chinh_thuc
  from "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_enrollment" e
  join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_class" c on c.id = e."lopHocId" and c."deletedAt" is null
 where e."deletedAt" is null
   and e."trangThai" = 'CHINH_THUC'
```

### Cơ hội theo tầng phễu
Cách tính: phễu CỘNG DỒN — một cơ hội đang ở tầng C4 vẫn được tính ở CẢ 4 tầng (C1≥C2≥C3≥C4), khác với
phân loại rời-từng-tầng (nháp ban đầu lệch hẳn với Model vì lý do này, đúng như cảnh báo trước khi đối
soát). Một cơ hội gắn nhiều lớp thì tính lặp lại ở mỗi lớp nó gắn — đúng theo cách Model đang hiển thị cho
TỔNG toàn hệ thống (Model không lọc "Dòng đại diện" khi hiển thị tổng theo tầng).
Đã đối soát với Model "Cơ hội theo tầng phễu" (câu hỏi "Phễu chuyển đổi (C1 → C4)") ngày 2026-08-24:
C1 22.756 = 22.756 · C2 11.365 = 11.365 · C3 5.080 = 5.080 · C4 4.712 = 4.712.

```sql
select t.tang, count(*)::int as so_co_hoi
  from "workspace_6ytci89jf3kflsl9aaaxrr5hw"."opportunity" o
  left join (
    select oi."coHoiId" as co_hoi_id, oi."lopHocId" as lop_hoc_id
      from "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_orderItem" oi
      join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_class" c on c.id = oi."lopHocId" and c."deletedAt" is null
     where oi."deletedAt" is null and oi."lopHocId" is not null
     group by 1, 2
  ) l on l.co_hoi_id = o.id
  cross join (values
    ('1. C1 · Lead tiềm năng',   array['LEAD_C1','LEAD_C2','LEAD_C3','LEAD_C31','LEAD_C4','LEAD_C41']),
    ('2. C2 · Quan tâm',         array['LEAD_C2','LEAD_C3','LEAD_C31','LEAD_C4','LEAD_C41']),
    ('3. C3 · Ghi danh',         array['LEAD_C3','LEAD_C31','LEAD_C4','LEAD_C41']),
    ('4. C4 · Đã chuyển khoản',  array['LEAD_C4','LEAD_C41'])
  ) as t(tang, ma_tang)
 where o."deletedAt" is null
   and o."phanLoaiLead"::text = any(t.ma_tang)
 group by 1
 order by 1
```

⚠ Không dùng `with … as (…)` (CTE) — qua server `insight` thật, middleware `apply_workspace_sql_remapping` từng
viết lại câu CTE và gãy với lỗi `column "v" does not exist` (không phải lỗi cú pháp của câu gốc). Viết phẳng,
dùng subquery lồng trong `FROM`/`JOIN`, không dùng `WITH`, cho MỌI câu SQL trong file này.

### Lớp học
Cách tính: sĩ số CHÍNH THỨC (`trangThai = 'CHINH_THUC'`) theo từng lớp, sắp theo ngày tổ chức gần nhất.
Model "Lớp học (Buổi đào tạo)" không có sẵn cột "sĩ số chỉ tính chính thức" theo từng lớp nên đối soát ở
mức TỔNG hệ thống, qua 2 đường độc lập:
Đã đối soát với Model "Lớp học (Buổi đào tạo)" ngày 2026-08-24: (a) tổng "Doanh thu net (VND)" cộng dồn
qua toàn bộ 197 lớp (cùng công thức Model dùng, nối qua `_enrollment."dongDonId"`) = 53.582.870.000 =
53.582.870.000 — xác nhận cấu trúc join theo từng lớp ở SQL dưới đây là đúng; (b) tổng sĩ số chính thức
cộng dồn qua 197 lớp = 5.066, khớp đúng số đã đối soát ở mục "Ghi danh chính thức" phía trên.

```sql
select c."maLopHoc", k."tenKhoaHoc", c."ngayToChuc", c."siSoMucTieu",
       count(e.id) filter (where e."trangThai" = 'CHINH_THUC')::int as si_so_chinh_thuc
  from "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_class" c
  left join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_course"     k on k.id = c."khoaHocId"  and k."deletedAt" is null
  left join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_enrollment" e on e."lopHocId" = c.id   and e."deletedAt" is null
 where c."deletedAt" is null
 group by 1, 2, 3, 4
 order by c."ngayToChuc" desc nulls last
 limit 50
```

### Đối tác doanh nghiệp
Cách tính: theo từng công ty của học viên, đếm số học viên (distinct) và số lượt ghi danh CHÍNH THỨC.
Đã đối soát với Model "Đối tác doanh nghiệp" ngày 2026-08-24: số công ty 940 = 940, tổng số học viên
1.683 = 1.683 (khớp tuyệt đối). Tổng số lượt ghi danh: SQL (chỉ tính CHINH_THUC) ra 4.880, Model (tính
TẤT CẢ trạng thái ghi danh, không lọc CHINH_THUC) ra 4.883 — chênh 3, đúng bằng đúng số ghi danh
không-CHINH_THUC còn lại của hệ thống tại các công ty đó (đã xác minh riêng qua `execute_sql`), không phải
sai số đếm.

```sql
select cty."name" as cong_ty,
       count(distinct e."hocVienId")::int as so_hoc_vien,
       count(e.id)::int                   as so_luot_ghi_danh
  from "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_enrollment" e
  join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."person"  p   on p.id = e."hocVienId"  and p."deletedAt" is null
  join "workspace_6ytci89jf3kflsl9aaaxrr5hw"."company" cty on cty.id = p."companyId" and cty."deletedAt" is null
 where e."deletedAt" is null
   and e."trangThai" = 'CHINH_THUC'
 group by 1
 order by 2 desc
 limit 50
```

## Học viên & ghi danh

5. **"Ghi danh chính thức" = `_enrollment."trangThai" = 'CHINH_THUC'`.** TUYỆT ĐỐI không được suy ra từ
   `opportunity."phanLoaiLead"` (vd coi C4/C41 là "đã ghi danh"). Ca lỗi thật: suy từ cơ hội đã làm **mất
   390 trên 5013 ghi danh, trải trên 89/178 lớp**; lớp `AIO.0001.K06` mất 50/50 = mất trắng 100%.
6. **Khách mời / vé tặng / bảo lưu KHÔNG tạo `opportunity`** (`coHoiId` NULL 100% cho 3 loại này). Vì vậy khi
   chỉ cần lấy thêm cột từ `opportunity` (ví dụ nguồn/kênh) cho một tập ghi danh, **luôn `LEFT JOIN`** —
   `INNER JOIN` sẽ âm thầm xoá sạch nhóm khách mời/vé tặng/bảo lưu ra khỏi kết quả mà không báo lỗi.
7. **`_enrollment."active"` là cờ ĐÃ THANH TOÁN** (bật khi cơ hội lên C4/C41, tắt khi còn ở C0–C31), **không
   phải cờ "có mặt trong lớp"**. Dùng cờ này để đếm sĩ số/ghi danh chính thức là lặp lại đúng lỗi ở mục 5.

## Cơ hội & kênh

8. **Phân loại Kênh của một cơ hội:** `nguon like '%ADS'` → **Paid Sale** · `nguon is null` → **Nguồn chưa
   rõ** · còn lại → **Organic Sale**. Dùng đúng 3 tên nhãn này, đừng tự dịch khác.
   ⚠ **Nhánh NULL riêng là BẮT BUỘC** — `NULL like '%ADS'` cho kết quả NULL nên rơi thẳng vào `else`, khiến
   khoảng 284 cơ hội chưa nhập nguồn bị đếm nhầm thành "miễn phí". Ảnh hưởng không đều theo tầng phễu, tầng C3
   từng lệch tới 17,3%.
9. **Đường nối Cơ hội → Lớp đi qua `_orderItem."coHoiId"` + `_orderItem."lopHocId"`.** KHÔNG được join qua
   `_order` — cách đó chỉ thấy cơ hội đã có đơn hàng (từ tầng C3 trở lên) và âm thầm bỏ sót toàn bộ C1/C2.
   Lưu ý: `opportunity` không còn cột `lopHocId` lẫn `donHangId` nữa (đã bỏ từ 2026-07).
10. **Một cơ hội có thể mua vé cho NHIỀU lớp** (thực tế trên hệ thống: 63 cơ hội như vậy). Khi đếm cơ hội
    theo từng lớp, đừng lọc kiểu `distinct on (coHoiId)` để gán mỗi cơ hội về đúng 1 lớp — cách đó làm cơ hội
    biến mất khỏi mọi lớp còn lại của nó; lỗi thật đã làm mất 118 lượt (cơ hội × lớp) trên 18 lớp.

## Khoảng trống dữ liệu — phải nói ra với người dùng, không im lặng bỏ qua

- **Có lớp thiếu ngày tổ chức** (`_class."ngayToChuc"` NULL) — riêng lớp `AIO.0001.K06` có 54 ghi danh — nên
  **không rơi vào bất kỳ khoảng lọc thời gian nào**. Khi câu hỏi lọc theo kỳ (tháng/quý/năm), phải nhắc điều
  này nếu số liệu có khả năng bỏ sót các lớp dạng đó.
- Có ghi danh **chưa điền học viên** (bán vé trước, gán tên học viên sau) ⇒ "lượt ghi danh" cao hơn "số học
  viên" (theo đầu người) là **ĐÚNG nghiệp vụ**, không phải lỗi đếm trùng hay đếm thiếu.
- **Tổng số học viên cộng dồn theo từng năm sẽ lớn hơn tổng số học viên của cả giai đoạn** — vì một người học
  nhiều năm chỉ được tính 1 lần khi gộp cả giai đoạn. Đừng cộng các con số theo-năm lại rồi so với tổng chung.

## Luôn luôn

- Viết SQL trên bảng gốc: MỌI bảng phải ghi đủ `"<schema>"."<bảng>"` — tên bảng trần (vd `"_class"` một mình)
  báo lỗi `relation does not exist`. Tên schema hiện tại: `workspace_6ytci89jf3kflsl9aaaxrr5hw` (tự kiểm bằng
  câu ở `index.md`).
- Lọc `"deletedAt" IS NULL` trên MỌI bảng khi viết SQL trực tiếp.
- Bảng của object tuỳ chỉnh có tiền tố `_` (`_class`, `_course`, `_order`, `_orderItem`, `_payment`,
  `_enrollment`, `_salesPolicy`); object chuẩn của CRM thì không có tiền tố (`opportunity`, `person`,
  `company`).
- Các cột tiền tệ có hậu tố `AmountMicros` lưu đơn vị micro — chia cho 1.000.000 (1e6) để ra VND.

## ⚠ CHƯA CHỐT: doanh thu tính theo "có đơn hàng" hay "cơ hội đã chốt"?

Hai định nghĩa đang cùng tồn tại, chênh **4,25 tỷ** trên tổng doanh thu:

| Cách tính | Doanh thu NET |
|---|---|
| Có đơn hàng thật (quy tắc #1) | 57.691.770.000 |
| Cơ hội đã chốt — tầng LEAD_C4/LEAD_C41 (Model + 6 dashboard chính thức) | 53.439.410.000 |

Chênh lệch nằm ở những **đơn hàng CÓ THẬT nhưng cơ hội chưa lên chốt**, đo ngày 24/08:
LEAD_C3 3.994.420.000 · LEAD_C1 165.900.000 · LEAD_C2 66.000.000 · LEAD_C31 27.000.000 ·
không gắn cơ hội −960.000.

**SQL chuẩn trong file này theo cách thứ hai (C4/C41)** để plugin nói cùng con số với dashboard công ty
đang dùng hằng ngày.

**Bắt buộc:** khi trả lời câu hỏi về tổng doanh thu công ty/kỳ, phải nói rõ *"tính theo đơn đã chốt"*.
Nếu người dùng hỏi vì sao lệch với sổ sách, hoặc hỏi doanh thu theo đơn đã ký, thì nêu cả hai con số và
nói thẳng là quy ước này chưa được chốt. Không tự đổi cách tính giữa chừng.

## ⚠ CHƯA CHỐT: doanh số quy cho ai?

Cùng một đơn đang có HAI đáp án khác nhau, chênh lệch thật:
- `opportunity."sale"` — trường quy kết chính thức
- người tạo đơn `_order."createdByName"`

Ca thật 17/08/2026: đơn `DH_260817_sang.le_001` do **Nguyễn Hằng** tạo, cơ hội do **Sàng Xuân** tạo, nhưng
`sale` gán **PHUONG_ANH**. Tính theo cách nào thì tuần đó Phương Anh có **5 vé / 77,76 triệu** hoặc
**4 vé / 61,56 triệu** — chênh 16 triệu chỉ vì một quy ước chưa chốt.

Model `Dòng đơn hàng (Vé)` còn thêm một tầng suy diễn: khi `sale` trống thì suy từ email `picId`
(`anh.dau`→PHUONG_ANH, `hue.tran`→HUE, `hang.pham`→HANG).

**Bắt buộc:** câu hỏi nào đụng tới hiệu suất/doanh số của một Sale cụ thể thì phải HỎI LẠI người dùng tính
theo cách nào, và nói rõ mình đang tính theo cách đó. Tuyệt đối không tự chọn rồi trả số. Chưa chốt quy tắc
thì chưa dựng báo cáo KPI cho Sale.
