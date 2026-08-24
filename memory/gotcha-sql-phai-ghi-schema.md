---
name: gotcha-sql-phai-ghi-schema
description: Mọi câu SQL phải ghi đủ "<schema>"."<bảng>" — search_path không chứa workspace schema, tên bảng trần luôn lỗi "relation does not exist"
type: experience
---

`search_path` của kết nối Metabase là `"$user", public`, **không** chứa workspace schema của Twenty. Đo thật:

```
select count(*) from "_class"
  → ERROR: relation "_class" does not exist

select count(*) from "workspace_6ytci89jf3kflsl9aaaxrr5hw"."_class"
  → chạy được
```

Tên schema: prod `workspace_6ytci89jf3kflsl9aaaxrr5hw` · local `workspace_1wgvd1injqtife6y4rvfbu3h5`. Tự kiểm
bằng câu SQL trong `plugin/knowledge/index.md` (`information_schema.tables where table_schema like 'workspace%'`).

## Vì sao đây quan trọng HƠN trước, không phải kém đi

Từ v0.2 SQL qua `execute_sql` của server `insight` là **đường ghi/đọc duy nhất** của plugin — không còn tool
tự viết nào âm thầm ghép schema vào tên bảng hộ model. Model phải tự viết đủ `"<schema>"."<bảng>"` trong MỌI
câu SQL, dựa vào tên bảng liệt kê trong `plugin/knowledge/index.md` và `quy-tac-chung.md`. Quên schema không
chỉ làm câu hỏi hiện tại lỗi — nó còn làm hỏng **bước "Kiểm tra chéo bắt buộc"** của skill `dung-bao-cao`
(đếm lại một KPI bằng SQL từ bảng gốc), tức vô hiệu cơ chế chống-số-sai là lý do tồn tại của cả plugin.

⇒ Khi viết hoặc sửa bất kỳ câu SQL mẫu nào trong `knowledge/`, luôn tự hỏi: **câu này có ghi đủ
`"<schema>"."<bảng>"` trên MỌI bảng tham gia không?**
