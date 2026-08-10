import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMetabase, MetabaseError } from '../plugin/mcp/metabase.mjs';

function fakeFetch(routes) {
  const calls = [];
  const impl = async (url, opts = {}) => {
    calls.push({ url, opts });
    const key = `${opts.method || 'GET'} ${new URL(url).pathname}`;
    const r = routes[key];
    if (!r) return { ok: false, status: 404, text: async () => '{"message":"không có route"}' };
    return { ok: r.status < 400, status: r.status, text: async () => JSON.stringify(r.body) };
  };
  impl.calls = calls;
  return impl;
}

test('login trả session token và gắn vào các lời gọi sau', async () => {
  const f = fakeFetch({
    'POST /api/session': { status: 200, body: { id: 'sess-123' } },
    'GET /api/user/current': { status: 200, body: { id: 3, email: 'a@b.c', personal_collection_id: 108 } },
  });
  const mb = createMetabase({ baseUrl: 'http://x', fetchImpl: f });
  assert.equal(await mb.login('a@b.c', 'pw'), 'sess-123');
  const me = await mb.me();
  assert.equal(me.personal_collection_id, 108);
  assert.equal(f.calls[1].opts.headers['X-Metabase-Session'], 'sess-123');
});

test('không gửi header phiên khi chưa đăng nhập', async () => {
  const f = fakeFetch({ 'GET /api/user/current': { status: 200, body: {} } });
  const mb = createMetabase({ baseUrl: 'http://x', fetchImpl: f });
  await mb.me();
  assert.equal(f.calls[0].opts.headers['X-Metabase-Session'], undefined);
});

test('lỗi HTTP ném MetabaseError kèm status', async () => {
  const f = fakeFetch({ 'POST /api/collection': { status: 403, body: { message: 'Bạn không có quyền' } } });
  const mb = createMetabase({ baseUrl: 'http://x', fetchImpl: f });
  await assert.rejects(
    () => mb.api('/api/collection', { method: 'POST', body: { name: 'x' } }),
    (e) => e instanceof MetabaseError && e.status === 403 && /không có quyền/.test(e.message),
  );
});

test('api() serialize body thành JSON và đặt Content-Type', async () => {
  const f = fakeFetch({ 'POST /api/card': { status: 200, body: { id: 7 } } });
  const mb = createMetabase({ baseUrl: 'http://x', fetchImpl: f });
  assert.deepEqual(await mb.api('/api/card', { method: 'POST', body: { name: 'thẻ' } }), { id: 7 });
  assert.equal(f.calls[0].opts.headers['Content-Type'], 'application/json');
  assert.equal(f.calls[0].opts.body, JSON.stringify({ name: 'thẻ' }));
});
