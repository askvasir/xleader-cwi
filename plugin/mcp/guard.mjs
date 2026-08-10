// Guardrail LỚP 2: chặn sớm + báo lỗi tiếng Việt tử tế.
// Lớp 1 (thật sự) là quyền collection của Metabase — xem Task 11.
// Logic THUẦN: không fetch, không đọc file. Vì vậy test được trọn vẹn.

export class GuardError extends Error {
  constructor(message) { super(message); this.name = 'GuardError'; }
}

/** Collection có nằm trong cây con personal collection của tôi không? */
export function isMine(collection, personalCollectionId) {
  if (!collection || personalCollectionId == null) return false;
  // Chuẩn hoá về chuỗi ở CẢ HAI nhánh. Metabase có lúc trả id dạng số, có lúc dạng chuỗi;
  // nếu một nhánh so strict còn nhánh kia coerce thì cùng một người sẽ vào được thư mục CON
  // mà lại bị chặn oan ngay tại thư mục GỐC của chính mình.
  const pid = String(personalCollectionId);
  if (String(collection.id) === pid) return true;
  const loc = collection.location;
  if (typeof loc !== 'string') return false;
  // location dạng "/108/130/" — so khớp NGUYÊN đoạn để 1080 không dính vào 108.
  return loc.split('/').filter(Boolean).includes(pid);
}

const LOI_NGOAI_PHAM_VI =
  'Chỗ này là báo cáo chung của công ty nên em không tạo/sửa được. ' +
  'Em tạo một bản riêng trong thư mục riêng của anh/chị rồi chỉnh thoải mái nhé?';

export function assertCanCreate({ collection, personalCollectionId }) {
  if (!isMine(collection, personalCollectionId)) throw new GuardError(LOI_NGOAI_PHAM_VI);
}

export function assertCanModify({ entity, collection, myUserId, personalCollectionId }) {
  if (!isMine(collection, personalCollectionId)) throw new GuardError(LOI_NGOAI_PHAM_VI);
  // Thiếu danh tính thì CHẶN, đừng cho qua. `undefined !== undefined` là `false` ⇒ nếu chỉ so
  // bằng `!==` thì một entity không có creator_id sẽ lọt qua mà không hề xác minh được gì.
  if (entity?.creator_id == null || myUserId == null) {
    throw new GuardError('Em chưa xác định được ai tạo báo cáo này nên không dám sửa. Anh/chị chạy lại /start giúp em nhé.');
  }
  // So sánh NGHIÊM NGẶT (không coerce kiểu): lệch kiểu thì chặn oan còn hơn cho qua nhầm.
  if (entity.creator_id !== myUserId) {
    throw new GuardError(
      `"${entity?.name ?? 'Báo cáo này'}" không phải do anh/chị tạo nên em không sửa được. ` +
      'Em tạo một bản sao trong thư mục riêng của anh/chị nhé?',
    );
  }
}
