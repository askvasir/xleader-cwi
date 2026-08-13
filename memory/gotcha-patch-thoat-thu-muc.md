---
name: gotcha-patch-thoat-thu-muc
description: Guard kiểm vị trí HIỆN TẠI của thẻ nhưng không kiểm vị trí ĐÍCH — patch.collection_id là đường đẩy thẻ ra khỏi thư mục riêng vào collection dùng chung
type: experience
---

`updateCard` nhận `patch` rồi chuyển **thẳng** vào body `PUT /api/card/{id}`. `assertCanModify` kiểm rằng thẻ
**đang** nằm trong thư mục riêng và **do chính người đó tạo** — cả hai đều đúng. Nhưng không ai kiểm thẻ sẽ
**đi đâu**:

```js
updateCard(mb, CTX, { id: 55, patch: { collection_id: 74 } })
→ PUT /api/card/55 body {"collection_id":74}   // thẻ bị đẩy sang collection DÙNG CHUNG
```

Thẻ vẫn "của mình" nên guard thấy hợp lệ. `patch: {creator_id: 999}` cũng lọt vào body y hệt.

## Vì sao khó thấy

`createCard` **có** kiểm đích qua `assertCanCreate`. Sự bất đối xứng giữa hai hàm ngay cạnh nhau là thứ đọc
lướt sẽ bỏ qua. Nó chỉ lộ ra khi có người được giao nhiệm vụ **tìm cách lách**, chứ không phải *đọc xem có
đúng không*.

## Cách chặn hiện tại

- `PATCH_CHO_PHEP` — allowlist trường được sửa; trường lạ → `GuardError`.
- Khi `patch.collection_id` có mặt: gọi `assertCanCreate` trên collection **ĐÍCH**.
- `patch` vắng/`null`/mảng → `GuardError` tiếng Việt, không để nổ `TypeError`.

Đã thử và đều bị chặn: `collection_id` dạng chuỗi `'74'`, key có khoảng trắng `'collection_id '`, trộn trường
hợp lệ với đích cấm. Vẫn cho qua đúng ca hợp lệ: đổi chỗ sang thư mục con khác **của mình**.

## Quy tắc rút ra

Với mọi thao tác di chuyển/đổi chỗ, kiểm **cả nguồn lẫn đích**. Và dữ liệu do người gọi đưa vào mà được
chuyển thẳng vào body API thì phải có allowlist trường — "chỉ chuyển tiếp thôi" là cách guard bị vòng qua.
