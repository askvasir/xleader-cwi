---
name: recipe-doi-soat-so-lieu
description: Cách chứng minh plugin trả SỐ ĐÚNG chứ không chỉ CHẠY ĐƯỢC — bất biến Model↔SQL, 7 phép kiểm nghiệp vụ đã đo, và các bẫy làm số sai trong im lặng
type: experience
---

Bài học đắt nhất của cả hệ sinh thái này: **SQL chạy được ≠ số đúng.** Mọi lỗi số liệu thật từng gặp đều đi
qua các cổng kiểm "thẻ có chạy không" một cách sạch sẽ.

## Bất biến nền: Model ↔ SQL phải bằng nhau

`scripts/thu-truy-van.mjs` đếm cùng một thứ qua hai đường: aggregation trên Model, và `count(*)` thẳng từ bảng
gốc. Đo trên local: **4974 = 4974**. Lệch là dừng, tìm nguyên nhân — **đừng sửa SQL cho khớp**.

```bash
MB_URL=http://localhost:3001 MB_USER=<admin> MB_PASS=<mk> \
MB_WS=workspace_1wgvd1injqtife6y4rvfbu3h5 node scripts/thu-truy-van.mjs
```

## Bảy quy tắc nghiệp vụ đã đo lại bằng SQL độc lập

Toàn bộ `business-rules.md` đã được kiểm chứng bằng truy vấn thật trên dữ liệu local, không phải đọc tài liệu:

| Quy tắc | Đo được |
|---|---|
| Doanh thu phải `INNER JOIN _order` | bỏ join → doanh thu **thổi ×4,76** (17.005/21.973 dòng `_orderItem` không phải doanh thu) |
| Số vé = `Σ soLuong`, không phải `count(*)` | lệch 4 do 2 dòng hoàn `soLuong = -1` |
| Khách mời/vé tặng/bảo lưu không tạo cơ hội | `KHACH_MOI` 196/196 · `VE_TANG` 48/48 · `BAO_LUU` 85/85 — **100%** `coHoiId` NULL |
| "Chính thức" = `_enrollment.trangThai`, không suy từ cơ hội | suy từ cơ hội **mất 333/4.973** ghi danh (6,7%) |
| Kênh phải có nhánh riêng cho `nguon` NULL | 154 cơ hội `nguon` NULL sẽ bị xếp nhầm |
| Lớp thiếu `ngayToChuc` rơi khỏi mọi khoảng lọc | 21 lớp · `AIO.0001.K06` = 54 ghi danh |
| `active` là cờ ĐÃ THANH TOÁN, không phải "có mặt" | khớp 100% `trangThai='CHINH_THUC'` nhưng **không** khớp `phanLoaiLead` |

Con số trong `business-rules.md` là **ví dụ đo tại một thời điểm** — cần số thì phải TRUY VẤN, tuyệt đối
không trích số trong tài liệu cho người dùng.

## Khi khách báo "lệch ở lớp X"

Khách chỉ nhìn thấy 1 lớp; lỗi thì gần như luôn là hệ thống. **Trước khi đụng SQL**, chạy một truy vấn diff
**mọi nhóm** giữa định nghĩa đang dùng và chân lý đếm thẳng, rồi báo con số quy mô. Ca thật ở dự án CRM: khách
báo **1 dòng** ở `QTC.BCQT.K08` → đo ra **390 dòng / 89 lớp**.

## Các bẫy làm số sai trong im lặng

- **`INNER JOIN` bảng phụ = lọc ngầm.** Bảng phụ chỉ để lấy THÊM CỘT ⇒ luôn `LEFT JOIN`. Mỗi `join` phải trả
  lời được: "dòng không khớp bên kia có được phép biến mất không?"
- **Lọc bằng trạng thái của bảng CHA.** Bảng fact có sẵn trường trạng thái của nó thì BẮT BUỘC dùng cái đó.
- **NULL rơi vào nhánh `else`.** Mỗi khi phân loại vào nhóm, tự hỏi *"NULL đi đâu?"*.
- **`distinct on` làm mất dòng** khi một bản ghi thuộc nhiều nhóm.
- **Enum đã ngừng dùng** → KPI luôn trả 0 cho mọi lát cắt mà không ai nghi ngờ.

## Với mỗi báo cáo dựng qua plugin

Skill `dung-bao-cao` bắt buộc: mỗi KPI phải đếm lại bằng **một đường độc lập** (thẻ trên Model thì đếm lại
bằng `mode:'sql'` từ bảng gốc, và ngược lại). Khớp → nói ✅. Lệch → nói thẳng *"⚠ số này em chưa chắc"*.
**Tuyệt đối không im lặng.**

⚠ Bước này phụ thuộc `mode:'sql'` chạy được — xem [[gotcha-sql-phai-ghi-schema]].
