import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isMine, assertCanCreate, assertCanModify, GuardError } from '../plugin/mcp/guard.mjs';

const MY_PERSONAL = 108;
const ME = 3;
const myRoot   = { id: 108, location: '/' };            // chính personal collection
const myChild  = { id: 130, location: '/108/' };        // thư mục con trong personal
const myDeep   = { id: 140, location: '/108/130/' };    // sâu hơn
const shared   = { id: 74,  location: '/' };            // XLeaders – Models
const otherPer = { id: 4,   location: '/' };            // personal của người khác
const sharedSub= { id: 9,   location: '/5/' };          // con của collection chung

test('isMine: đúng cho personal và mọi thư mục con', () => {
  assert.equal(isMine(myRoot, MY_PERSONAL), true);
  assert.equal(isMine(myChild, MY_PERSONAL), true);
  assert.equal(isMine(myDeep, MY_PERSONAL), true);
});

test('isMine: sai cho collection chung, personal người khác, con của collection chung', () => {
  assert.equal(isMine(shared, MY_PERSONAL), false);
  assert.equal(isMine(otherPer, MY_PERSONAL), false);
  assert.equal(isMine(sharedSub, MY_PERSONAL), false);
});

test('isMine: KHÔNG nhận nhầm id trùng tiền tố (1080 không thuộc 108)', () => {
  assert.equal(isMine({ id: 1080, location: '/' }, MY_PERSONAL), false);
  assert.equal(isMine({ id: 999, location: '/1080/' }, MY_PERSONAL), false);
});

test('isMine: root (location null) không bao giờ là của mình', () => {
  assert.equal(isMine({ id: 'root', location: null }, MY_PERSONAL), false);
});

test('CA 1 — tạo trong collection dùng chung bị chặn', () => {
  assert.throws(() => assertCanCreate({ collection: shared, personalCollectionId: MY_PERSONAL }),
    (e) => e instanceof GuardError && /báo cáo chung/.test(e.message));
});

test('CA 2 — sửa thẻ của người khác bị chặn (dù nằm trong thư mục của tôi)', () => {
  assert.throws(() => assertCanModify({
    entity: { id: 55, name: 'Doanh thu', creator_id: 9 },
    collection: myChild, myUserId: ME, personalCollectionId: MY_PERSONAL,
  }), (e) => e instanceof GuardError && /không phải do anh\/chị tạo/.test(e.message));
});

test('CA 3 — archive dashboard của người khác bị chặn', () => {
  assert.throws(() => assertCanModify({
    entity: { id: 6, name: 'Chỉ số Sale — khám phá', creator_id: 1 },
    collection: shared, myUserId: ME, personalCollectionId: MY_PERSONAL,
  }), (e) => e instanceof GuardError);
});

test('CA 4 — tạo và sửa trong thư mục riêng của mình thì ĐƯỢC', () => {
  assert.doesNotThrow(() => assertCanCreate({ collection: myChild, personalCollectionId: MY_PERSONAL }));
  assert.doesNotThrow(() => assertCanModify({
    entity: { id: 55, name: 'Báo cáo của tôi', creator_id: ME },
    collection: myChild, myUserId: ME, personalCollectionId: MY_PERSONAL,
  }));
});

test('CHẶN khi thiếu danh tính người tạo (đừng để undefined === undefined lọt qua)', () => {
  // Đây là ca nguy hiểm nhất: `entity.creator_id !== myUserId` với cả hai đều undefined
  // cho ra `false` ⇒ KHÔNG ném lỗi ⇒ sửa được thứ chưa hề xác minh chủ sở hữu.
  assert.throws(() => assertCanModify({
    entity: {}, collection: myChild, myUserId: ME, personalCollectionId: MY_PERSONAL,
  }), (e) => e instanceof GuardError && /chưa xác định được ai tạo/.test(e.message));
  assert.throws(() => assertCanModify({
    entity: { id: 1, name: 'x', creator_id: ME }, collection: myChild,
    myUserId: undefined, personalCollectionId: MY_PERSONAL,
  }), (e) => e instanceof GuardError);
});

test('isMine nhất quán khi personalCollectionId là CHUỖI (Metabase trả kiểu không cố định)', () => {
  // Thư mục con và thư mục gốc phải cho cùng một câu trả lời.
  assert.equal(isMine(myChild, '108'), true, 'thư mục con');
  assert.equal(isMine(myRoot, '108'), true, 'thư mục GỐC — nhánh hay bị bỏ sót');
  assert.equal(isMine(shared, '108'), false);
  assert.equal(isMine({ id: 1080, location: '/' }, '108'), false, 'không dính tiền tố');
});

test('thông điệp lỗi là tiếng Việt và có gợi ý lối ra', () => {
  try {
    assertCanCreate({ collection: shared, personalCollectionId: MY_PERSONAL });
    assert.fail('phải ném lỗi');
  } catch (e) {
    assert.match(e.message, /thư mục riêng/);
  }
});
