---
name: gotcha-sql-phai-ghi-schema
description: Mọi câu SQL phải ghi đủ "<schema>"."<bảng>" — search_path không chứa workspace schema, tên bảng trần luôn lỗi "relation does not exist"
type: experience
---

`search_path` của kết nối Metabase là `"$user", public`, **không** chứa workspace schema của Twenty. Đo thật
trên local:

```
select count(*) from "_class"
  → ERROR: relation "_class" does not exist

select count(*) from "workspace_1wgvd1injqtife6y4rvfbu3h5"."_class"
  → 195
```

Lấy tên schema bằng `cwi_dict {list:true}` → khoá `schema`. Local
`workspace_1wgvd1injqtife6y4rvfbu3h5` · prod `workspace_6ytci89jf3kflsl9aaaxrr5hw`.

## Vì sao đây từng là lỗi Critical

Từ điển và cả 2 skill viết tên bảng **trần** (`_orderItem`, `_class`), còn tên schema chỉ tồn tại trong một
hằng nội bộ của `server.mjs` — **không có đường nào để model biết**. Hệ quả dây chuyền:

1. Mọi câu hỏi cần `mode:'sql'` (tỉ lệ giữa các dòng, YoY, lọc kỳ gộp) ném lỗi tiếng Anh trước mặt nhân viên.
2. **Bước "Kiểm tra chéo bắt buộc" của skill `dung-bao-cao` — đếm lại bằng SQL từ bảng gốc — không chạy được.**
   Tức cơ chế chống-số-sai, lý do tồn tại của cả plugin, bị vô hiệu mà không ai biết.

Lỗi này **không lộ ra trong 13 vòng review theo từng task** vì mỗi mảnh đều đúng: từ điển đúng, tool đúng,
skill đúng. Chỉ khi ghép lại mới thấy thiếu mắt xích.

⇒ Khi thêm bất kỳ chỗ nào dạy model viết SQL, luôn tự hỏi: **model lấy tên schema từ đâu?**
