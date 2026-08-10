import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCard, updateCard, archive } from '../plugin/mcp/report.mjs';
import { GuardError } from '../plugin/mcp/guard.mjs';

const CTX = { myUserId: 3, personalCollectionId: 108 };

function fakeMb({ collections = {}, cards = {} } = {}) {
  const calls = [];
  return {
    calls,
    api: async (path, opts = {}) => {
      calls.push({ path, method: opts.method || 'GET' });
      let m;
      if ((m = path.match(/^\/api\/collection\/(\d+)$/))) return collections[m[1]] || { id: +m[1], location: '/' };
      if ((m = path.match(/^\/api\/card\/(\d+)$/)) && (opts.method || 'GET') === 'GET') return cards[m[1]];
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
  assert.ok(mb.calls.some((c) => c.method === 'PUT'));
  assert.equal(mb.calls.filter((c) => c.method === 'DELETE').length, 0, 'không bao giờ xoá vĩnh viễn');
});

test('archive thẻ của người khác bị chặn', async () => {
  const mb = fakeMb({
    collections: { 74: { id: 74, location: '/' } },
    cards: { 61: { id: 61, name: 'Báo cáo học viên', creator_id: 1, collection_id: 74 } },
  });
  await assert.rejects(() => archive(mb, CTX, { kind: 'card', id: 61 }), (e) => e instanceof GuardError);
});
