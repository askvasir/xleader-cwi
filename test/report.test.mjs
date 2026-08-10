import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCard, updateCard, createDashboard, putDashcards, archive } from '../plugin/mcp/report.mjs';
import { GuardError } from '../plugin/mcp/guard.mjs';

const CTX = { myUserId: 3, personalCollectionId: 108 };

function fakeMb({ collections = {}, cards = {}, dashboards = {} } = {}) {
  const calls = [];
  return {
    calls,
    api: async (path, opts = {}) => {
      const method = opts.method || 'GET';
      calls.push({ path, method, body: opts.body });   // giữ body để assert nội dung, không chỉ đếm
      let m;
      if ((m = path.match(/^\/api\/collection\/(\d+)$/)) && method === 'GET') {
        return collections[m[1]] || { id: +m[1], location: '/' };
      }
      if ((m = path.match(/^\/api\/card\/(\d+)$/)) && method === 'GET') return cards[m[1]];
      if ((m = path.match(/^\/api\/dashboard\/(\d+)$/)) && method === 'GET') return dashboards[m[1]];
      return { id: 999 };
    },
  };
}

test('tạo thẻ trong thư mục riêng thì được, và có gọi API', async () => {
  const mb = fakeMb({ collections: { 130: { id: 130, location: '/108/' } } });
  const r = await createCard(mb, CTX, { name: 'Thẻ của tôi', collectionId: 130, display: 'scalar', datasetQuery: {} });
  assert.equal(r.id, 999);
  assert.ok(mb.calls.some((c) => c.path === '/api/card' && c.method === 'POST'));
});

test('tạo thẻ trong collection dùng chung bị chặn TRƯỚC KHI gọi API ghi', async () => {
  const mb = fakeMb({ collections: { 74: { id: 74, location: '/' } } });
  await assert.rejects(
    () => createCard(mb, CTX, { name: 'x', collectionId: 74, display: 'scalar', datasetQuery: {} }),
    (e) => e instanceof GuardError,
  );
  assert.equal(mb.calls.filter((c) => c.method === 'POST').length, 0, 'không được gọi POST nào');
});

test('sửa thẻ của người khác bị chặn', async () => {
  const mb = fakeMb({
    collections: { 130: { id: 130, location: '/108/' } },
    cards: { 55: { id: 55, name: 'Thẻ người khác', creator_id: 9, collection_id: 130 } },
  });
  await assert.rejects(() => updateCard(mb, CTX, { id: 55, patch: { name: 'đổi' } }),
    (e) => e instanceof GuardError && /không phải do anh\/chị tạo/.test(e.message));
  assert.equal(mb.calls.filter((c) => c.method === 'PUT').length, 0);
});

test('sửa thẻ của chính mình thì được', async () => {
  const mb = fakeMb({
    collections: { 130: { id: 130, location: '/108/' } },
    cards: { 55: { id: 55, name: 'Thẻ của tôi', creator_id: 3, collection_id: 130 } },
  });
  await updateCard(mb, CTX, { id: 55, patch: { name: 'đổi' } });
  assert.ok(mb.calls.some((c) => c.path === '/api/card/55' && c.method === 'PUT'));
});

test('archive dùng PUT archived:true, KHÔNG dùng DELETE', async () => {
  const mb = fakeMb({
    collections: { 130: { id: 130, location: '/108/' } },
    cards: { 55: { id: 55, name: 'Thẻ của tôi', creator_id: 3, collection_id: 130 } },
  });
  await archive(mb, CTX, { kind: 'card', id: 55 });
  const put = mb.calls.find((c) => c.method === 'PUT');
  assert.ok(put, 'phải có PUT');
  assert.equal(put.body?.archived, true, 'body phải mang archived:true, không phải PUT bất kỳ');
  assert.equal(mb.calls.filter((c) => c.method === 'DELETE').length, 0, 'không bao giờ xoá vĩnh viễn');
});

test('CHẶN di chuyển thẻ ra collection dùng chung qua patch.collection_id', async () => {
  // Guard chỉ kiểm vị trí HIỆN TẠI. Không kiểm ĐÍCH thì đây là đường thoát ra ngoài thư mục riêng.
  const mb = fakeMb({
    collections: { 130: { id: 130, location: '/108/' }, 74: { id: 74, location: '/' } },
    cards: { 55: { id: 55, name: 'Thẻ của tôi', creator_id: 3, collection_id: 130 } },
  });
  await assert.rejects(() => updateCard(mb, CTX, { id: 55, patch: { collection_id: 74 } }),
    (e) => e instanceof GuardError);
  assert.equal(mb.calls.filter((c) => c.method === 'PUT').length, 0, 'không được PUT gì cả');
});

test('CHO PHÉP đổi chỗ thẻ sang thư mục con khác CỦA MÌNH', async () => {
  const mb = fakeMb({
    collections: { 130: { id: 130, location: '/108/' }, 131: { id: 131, location: '/108/' } },
    cards: { 55: { id: 55, name: 'Thẻ của tôi', creator_id: 3, collection_id: 130 } },
  });
  await updateCard(mb, CTX, { id: 55, patch: { collection_id: 131 } });
  assert.ok(mb.calls.some((c) => c.path === '/api/card/55' && c.method === 'PUT'));
});

test('CHẶN trường lạ trong patch (vd creator_id)', async () => {
  const mb = fakeMb({
    collections: { 130: { id: 130, location: '/108/' } },
    cards: { 55: { id: 55, name: 'Thẻ của tôi', creator_id: 3, collection_id: 130 } },
  });
  await assert.rejects(() => updateCard(mb, CTX, { id: 55, patch: { creator_id: 999 } }),
    (e) => e instanceof GuardError && /creator_id/.test(e.message));
  assert.equal(mb.calls.filter((c) => c.method === 'PUT').length, 0);
});

test('patch vắng / null / mảng → GuardError tiếng Việt, KHÔNG phải TypeError', async () => {
  const mb = fakeMb({
    collections: { 130: { id: 130, location: '/108/' } },
    cards: { 55: { id: 55, name: 'Thẻ của tôi', creator_id: 3, collection_id: 130 } },
  });
  for (const patch of [undefined, null, []]) {
    await assert.rejects(() => updateCard(mb, CTX, { id: 55, patch }),
      (e) => e instanceof GuardError && /Thiếu nội dung cần sửa/.test(e.message));
  }
  assert.equal(mb.calls.filter((c) => c.method === 'PUT').length, 0);
});

test('sửa báo cáo không tồn tại → GuardError tiếng Việt, KHÔNG phải TypeError', async () => {
  const mb = fakeMb({ collections: {}, cards: {} });   // GET /api/card/999 trả {id:999} giả
  const mbRong = { calls: [], api: async (p, o = {}) => {
    mbRong.calls.push({ path: p, method: o.method || 'GET' });
    return null;                                        // Metabase trả rỗng cho id không tồn tại
  } };
  await assert.rejects(() => updateCard(mbRong, CTX, { id: 999, patch: { name: 'x' } }),
    (e) => e instanceof GuardError && /không tìm thấy báo cáo/.test(e.message));
  assert.equal(mbRong.calls.filter((c) => c.method === 'PUT').length, 0);
});

test('createDashboard bị chặn ngoài thư mục riêng, KHÔNG có POST nào', async () => {
  const mb = fakeMb({ collections: { 74: { id: 74, location: '/' } } });
  await assert.rejects(() => createDashboard(mb, CTX, { name: 'x', collectionId: 74 }),
    (e) => e instanceof GuardError);
  assert.equal(mb.calls.filter((c) => c.method === 'POST').length, 0);
});

test('putDashcards bị chặn trên dashboard người khác, KHÔNG có PUT nào', async () => {
  const mb = fakeMb({
    collections: { 130: { id: 130, location: '/108/' } },
    dashboards: { 6: { id: 6, name: 'Chỉ số Sale', creator_id: 1, collection_id: 130 } },
  });
  await assert.rejects(() => putDashcards(mb, CTX, { dashboardId: 6, dashcards: [] }),
    (e) => e instanceof GuardError);
  assert.equal(mb.calls.filter((c) => c.method === 'PUT').length, 0);
});

test('archive thẻ của người khác bị chặn', async () => {
  const mb = fakeMb({
    collections: { 74: { id: 74, location: '/' } },
    cards: { 61: { id: 61, name: 'Báo cáo học viên', creator_id: 1, collection_id: 74 } },
  });
  await assert.rejects(() => archive(mb, CTX, { kind: 'card', id: 61 }), (e) => e instanceof GuardError);
});
