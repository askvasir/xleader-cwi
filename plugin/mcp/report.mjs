// ĐƯỜNG GHI DUY NHẤT của plugin. Mọi hàm ở đây gọi guard TRƯỚC khi chạm API ghi.
// Không có hàm nào gọi DELETE — gỡ báo cáo = archived:true (vào Thùng rác, khôi phục được).
import { assertCanCreate, assertCanModify, GuardError } from './guard.mjs';

// `patch` là dữ liệu do người gọi đưa vào và được chuyển THẲNG vào body PUT. Không lọc thì
// `patch.collection_id` trở thành một đường DI CHUYỂN thẻ ra khỏi thư mục riêng — guard chỉ
// kiểm vị trí HIỆN TẠI nên hoàn toàn không thấy. Chỉ cho phép đúng những trường cần thiết.
const PATCH_CHO_PHEP = new Set([
  'name', 'description', 'display', 'dataset_query', 'visualization_settings',
  'collection_id', 'collection_position', 'archived', 'result_metadata',
]);

const layCollection = (mb, id) => mb.api(`/api/collection/${id}`);

async function chanTruocKhiSua(mb, ctx, kind, id) {
  const entity = await mb.api(`/api/${kind}/${id}`);
  // Không kiểm thì `entity.collection_id` trên một id không tồn tại ném TypeError tiếng Anh
  // ra thẳng mặt người dùng — đúng thứ plugin này sinh ra để tránh.
  if (!entity?.id) throw new GuardError(`Em không tìm thấy báo cáo #${id} trên insight.`);
  const collection = await layCollection(mb, entity.collection_id);
  assertCanModify({ entity, collection, myUserId: ctx.myUserId, personalCollectionId: ctx.personalCollectionId });
  return entity;
}

/**
 * ĐỌC một thẻ/dashboard bất kỳ — KHÔNG qua guard, cố ý.
 * Spec: "Đọc thì tự do; chỉ GHI mới bị nhốt." Thiếu hàm này thì lời hứa "em tạo một bản sao
 * trong thư mục của anh/chị" trở thành lời hứa suông — không có đường nào lấy được
 * `dataset_query` của báo cáo chung để chép lại.
 * Quyền đọc thật vẫn do Metabase quyết định: user không xem được thì API trả 403.
 */
export async function getEntity(mb, { kind, id }) {
  const e = await mb.api(`/api/${kind}/${id}`);
  if (!e?.id) throw new Error(`Em không tìm thấy ${kind === 'card' ? 'thẻ' : 'báo cáo'} #${id} trên insight.`);
  return e;
}

export async function listMine(mb, { myUserId }) {
  const res = await mb.api(`/api/search?created_by=${myUserId}&models=card&models=dashboard&archived=false`);
  return (res.data || []).map((x) => ({ id: x.id, name: x.name, type: x.model, collection_id: x.collection?.id }));
}

export async function createCard(mb, ctx, { name, collectionId, display, datasetQuery, visualizationSettings = {} }) {
  assertCanCreate({ collection: await layCollection(mb, collectionId), personalCollectionId: ctx.personalCollectionId });
  return mb.api('/api/card', { method: 'POST', body: {
    name, display, collection_id: collectionId,
    dataset_query: datasetQuery, visualization_settings: visualizationSettings,
  }});
}

export async function updateCard(mb, ctx, { id, patch }) {
  // `rpc.mjs` không ép inputSchema, nên `patch` có thể vắng hoặc null khi tới đây.
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new GuardError('Thiếu nội dung cần sửa. Anh/chị cho em biết muốn đổi gì trong báo cáo nhé.');
  }
  await chanTruocKhiSua(mb, ctx, 'card', id);
  const la = Object.keys(patch).filter((k) => !PATCH_CHO_PHEP.has(k));
  if (la.length) throw new GuardError(`Em không sửa được trường: ${la.join(', ')}.`);
  if (patch.collection_id !== undefined) {
    // Kiểm ĐÍCH chứ không chỉ NGUỒN. Thiếu chỗ này thì đổi chỗ thẻ sang collection dùng chung
    // là hợp lệ dưới mắt guard — thẻ vẫn "của mình", chỉ là không còn ở thư mục riêng nữa.
    assertCanCreate({
      collection: await layCollection(mb, patch.collection_id),
      personalCollectionId: ctx.personalCollectionId,
    });
  }
  return mb.api(`/api/card/${id}`, { method: 'PUT', body: patch });
}

export async function createDashboard(mb, ctx, { name, collectionId }) {
  assertCanCreate({ collection: await layCollection(mb, collectionId), personalCollectionId: ctx.personalCollectionId });
  return mb.api('/api/dashboard', { method: 'POST', body: { name, collection_id: collectionId } });
}

export async function putDashcards(mb, ctx, { dashboardId, dashcards, tabs, parameters }) {
  await chanTruocKhiSua(mb, ctx, 'dashboard', dashboardId);
  const body = { dashcards };
  if (tabs) body.tabs = tabs;
  if (parameters) body.parameters = parameters;
  return mb.api(`/api/dashboard/${dashboardId}`, { method: 'PUT', body });
}

export async function archive(mb, ctx, { kind, id }) {
  await chanTruocKhiSua(mb, ctx, kind, id);
  return mb.api(`/api/${kind}/${id}`, { method: 'PUT', body: { archived: true } });
}
