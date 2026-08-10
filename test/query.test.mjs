import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertReadOnly, runModelQuery, runSql } from '../plugin/mcp/query.mjs';

test('assertReadOnly cho qua câu SELECT bình thường', () => {
  assert.doesNotThrow(() => assertReadOnly('select count(*) from "_class" where "deletedAt" is null'));
});

test('assertReadOnly chặn mọi lệnh ghi', () => {
  for (const sql of [
    'delete from "_class"',
    'DROP TABLE x',
    'update "_order" set a=1',
    'insert into x values (1)',
    'alter table x add column y int',
    'truncate x',
    'grant select on x to y',
    'select 1; delete from x',
  ]) {
    assert.throws(() => assertReadOnly(sql), /chỉ đọc/i, `phải chặn: ${sql}`);
  }
});

test('assertReadOnly KHÔNG chặn nhầm khi từ khoá nằm trong tên cột hoặc chuỗi', () => {
  assert.doesNotThrow(() => assertReadOnly(`select "updatedAt", 'đã insert' as ghi_chu from "_order"`));
  assert.doesNotThrow(() => assertReadOnly('select "deletedAt" from "_class"'));
});

test('assertReadOnly KHÔNG chặn oan câu SELECT có comment SQL', () => {
  // Đo thật ở vòng review: cả 3 ca dưới đều bị CHẶN OAN khi chưa bỏ comment.
  assert.doesNotThrow(() => assertReadOnly('select 1; -- ghi chú vô hại'));
  assert.doesNotThrow(() => assertReadOnly('select 1 -- delete from x nằm trong comment'));
  assert.doesNotThrow(() => assertReadOnly('select 1 /* delete this */'));
  assert.doesNotThrow(() => assertReadOnly(`select ';' as dau_cham_phay_trong_chuoi`));
});

function fakeMb(capture) {
  return { api: async (path, opts) => { capture.push({ path, opts }); return {
    status: 'completed', data: { cols: [{ display_name: 'Số lượng' }], rows: [[42]] } }; } };
}

test('runModelQuery gửi MBQL trỏ vào card__<id>', async () => {
  const cap = [];
  const r = await runModelQuery(fakeMb(cap), { databaseId: 2, modelId: 140,
    aggregation: [['count']], breakout: [['field', 'Sale', { 'base-type': 'type/Text' }]] });
  assert.equal(cap[0].path, '/api/dataset');
  assert.equal(cap[0].opts.body.query['source-table'], 'card__140');
  assert.deepEqual(cap[0].opts.body.query.aggregation, [['count']]);
  assert.deepEqual(r, { cols: ['Số lượng'], rows: [[42]] });
});

test('runSql gửi native query và kiểm tra chỉ đọc trước', async () => {
  const cap = [];
  await runSql(fakeMb(cap), { databaseId: 2, sql: 'select 1' });
  assert.equal(cap[0].opts.body.type, 'native');
  await assert.rejects(() => runSql(fakeMb([]), { databaseId: 2, sql: 'delete from x' }), /chỉ đọc/i);
});

test('kết quả status khác completed thì báo lỗi rõ ràng', async () => {
  const mb = { api: async () => ({ status: 'failed', error: 'column "x" does not exist' }) };
  await assert.rejects(() => runSql(mb, { databaseId: 2, sql: 'select x' }), /column "x" does not exist/);
});
