import { test } from 'node:test';
import assert from 'node:assert/strict';
import { docCauTrucThat } from '../plugin/mcp/server.mjs';
import { compareFingerprint } from '../plugin/mcp/dict.mjs';

// I4: docCauTrucThat từng luôn trả `enums: {}` (không đọc pg_enum) và cwi_health còn hardcode
// `enums: {}` ở VẾ TỪ ĐIỂN trước khi so — cả hai khiến nhánh enum của compareFingerprint không bao giờ
// chạy trong sản phẩm dù có 2 test xanh riêng cho compareFingerprint. Test này khoá lại: docCauTrucThat
// phải đọc enum THẬT (qua pg_enum/pg_type), và ghép với compareFingerprint phải PHÁT HIỆN được lệch.
function fakeMb(colRows, enumRows) {
  const calls = [];
  return {
    calls,
    api: async (path, opts) => {
      calls.push(opts.body.native.query);
      const isEnumQuery = /pg_enum/.test(opts.body.native.query);
      return { status: 'completed', data: { rows: isEnumQuery ? enumRows : colRows } };
    },
  };
}

test('docCauTrucThat gộp cột + giá trị enum thật thành enums["<bảng>.<cột>"]', async () => {
  const mb = fakeMb(
    [['opportunity', 'stage'], ['opportunity', 'id']],
    [['opportunity', 'stage', 'NEW'], ['opportunity', 'stage', 'CUSTOMER']],
  );
  const live = await docCauTrucThat(mb);
  assert.deepEqual(live.tables.opportunity.sort(), ['id', 'stage']);
  assert.deepEqual(live.enums['opportunity.stage'].sort(), ['CUSTOMER', 'NEW']);
  // hai truy vấn riêng: một cho cột, một cho enum — không được gộp thành một câu duy nhất bỏ sót enum
  assert.equal(mb.calls.length, 2);
});

test('nhánh enum THẬT SỰ so sánh: fingerprint đòi một giá trị mà DB không có phải bị báo lệch', async () => {
  const mb = fakeMb(
    [['opportunity', 'stage']],
    [['opportunity', 'stage', 'NEW']],   // DB thật thiếu 'CUSTOMER'
  );
  const live = await docCauTrucThat(mb);
  const fingerprint = { tables: { opportunity: ['stage'] }, enums: { 'opportunity.stage': ['NEW', 'CUSTOMER'] } };
  const ss = compareFingerprint(fingerprint, live);
  assert.equal(ss.ok, false, 'phải phát hiện enum lệch, không được báo khớp');
  assert.deepEqual(ss.enumLech, ['opportunity.stage']);
});

test('nhánh enum khớp thật sự thì báo ok — chứng minh không phải luôn-báo-lệch bù trừ cho luôn-báo-khớp cũ', async () => {
  const mb = fakeMb(
    [['opportunity', 'stage']],
    [['opportunity', 'stage', 'NEW'], ['opportunity', 'stage', 'CUSTOMER']],
  );
  const live = await docCauTrucThat(mb);
  const fingerprint = { tables: { opportunity: ['stage'] }, enums: { 'opportunity.stage': ['NEW', 'CUSTOMER'] } };
  const ss = compareFingerprint(fingerprint, live);
  assert.equal(ss.ok, true);
});
