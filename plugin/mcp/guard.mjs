// Guardrail LỚP 2: chặn sớm + báo lỗi tiếng Việt tử tế.
// Lớp 1 (thật sự) là quyền collection của Metabase — xem Task 11.
// Logic THUẦN: không fetch, không đọc file. Vì vậy test được trọn vẹn.

export class GuardError extends Error {
  constructor(message) { super(message); this.name = 'GuardError'; }
}

/** Collection có nằm trong cây con personal collection của tôi không? */
export function isMine(collection, personalCollectionId) {
  if (!collection || personalCollectionId == null) return false;
  if (collection.id === personalCollectionId) return true;
  const loc = collection.location;
  if (typeof loc !== 'string') return false;
  // location dạng "/108/130/" — so khớp NGUYÊN đoạn để 1080 không dính vào 108.
  return loc.split('/').filter(Boolean).includes(String(personalCollectionId));
}

const LOI_NGOAI_PHAM_VI =
  'Chỗ này là báo cáo chung của công ty nên em không tạo/sửa được. ' +
  'Em tạo một bản riêng trong thư mục riêng của anh/chị rồi chỉnh thoải mái nhé?';

export function assertCanCreate({ collection, personalCollectionId }) {
  if (!isMine(collection, personalCollectionId)) throw new GuardError(LOI_NGOAI_PHAM_VI);
}

export function assertCanModify({ entity, collection, myUserId, personalCollectionId }) {
  if (!isMine(collection, personalCollectionId)) throw new GuardError(LOI_NGOAI_PHAM_VI);
  if (entity?.creator_id !== myUserId) {
    throw new GuardError(
      `"${entity?.name ?? 'Báo cáo này'}" không phải do anh/chị tạo nên em không sửa được. ` +
      'Em tạo một bản sao trong thư mục riêng của anh/chị nhé?',
    );
  }
}
