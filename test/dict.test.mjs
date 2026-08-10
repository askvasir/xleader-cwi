import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sliceTables, findModel, compareFingerprint } from '../plugin/mcp/dict.mjs';

const schema = { tables: {
  _class: { label: 'Lớp học', columns: { maLopHoc: { label: 'Mã lớp học', type: 'TEXT' } } },
  _orderItem: { label: 'Dòng đơn hàng', columns: { thanhTienAmountMicros: { label: 'Thành tiền', type: 'CURRENCY' } } },
  opportunity: { label: 'Cơ hội', columns: { nguon: { label: 'Nguồn', type: 'SELECT', options: [{ value: 'FB_ADS', label: 'FB_Ads' }] } } },
}};

test('sliceTables chỉ trả bảng được hỏi, không trả bảng khác', () => {
  const r = sliceTables(schema, ['_class']);
  assert.deepEqual(Object.keys(r.tables), ['_class']);
  assert.deepEqual(r.thieu, []);
});

test('sliceTables báo tên bảng không tồn tại thay vì im lặng', () => {
  const r = sliceTables(schema, ['_class', '_khong_co']);
  assert.deepEqual(Object.keys(r.tables), ['_class']);
  assert.deepEqual(r.thieu, ['_khong_co']);
});

test('sliceTables giữ nguyên options của cột SELECT', () => {
  const r = sliceTables(schema, ['opportunity']);
  assert.equal(r.tables.opportunity.columns.nguon.options[0].value, 'FB_ADS');
});

const models = { models: [{ name: 'Cơ hội (Lead)', description: '', columns: [{ name: 'Mã lớp', base_type: 'type/Text' }] }] };

test('findModel tìm theo tên chính xác', () => {
  assert.equal(findModel(models, 'Cơ hội (Lead)').columns[0].name, 'Mã lớp');
  assert.equal(findModel(models, 'Không có'), null);
});

const fp = { tables: { _class: ['id', 'maLopHoc'] }, enums: { 'opportunity.nguon': ['FB_ADS', 'GIOI_THIEU'] } };

test('compareFingerprint: khớp thì ok', () => {
  const r = compareFingerprint(fp, { tables: { _class: ['id', 'maLopHoc'] }, enums: { 'opportunity.nguon': ['FB_ADS', 'GIOI_THIEU'] } });
  assert.equal(r.ok, true);
});

test('compareFingerprint: cột biến mất trên DB thật thì báo thiếu', () => {
  const r = compareFingerprint(fp, { tables: { _class: ['id'] }, enums: { 'opportunity.nguon': ['FB_ADS', 'GIOI_THIEU'] } });
  assert.equal(r.ok, false);
  assert.deepEqual(r.thieuCot, ['_class.maLopHoc']);
});

test('compareFingerprint: enum đổi giá trị thì báo lệch', () => {
  const r = compareFingerprint(fp, { tables: { _class: ['id', 'maLopHoc'] }, enums: { 'opportunity.nguon': ['FB_ADS', 'TIKTOK'] } });
  assert.equal(r.ok, false);
  assert.deepEqual(r.enumLech, ['opportunity.nguon']);
});

test('compareFingerprint: cột THÊM trên DB không phải lỗi (thay đổi cộng thêm là an toàn)', () => {
  const r = compareFingerprint(fp, { tables: { _class: ['id', 'maLopHoc', 'ghiChu'] }, enums: { 'opportunity.nguon': ['FB_ADS', 'GIOI_THIEU'] } });
  assert.equal(r.ok, true);
});

test('compareFingerprint: MẤT HẲN một bảng phải kêu, không im lặng bỏ qua', () => {
  // Chuông báo động câm còn tệ hơn không có chuông: bảng biến mất mà báo ok
  // ⇒ plugin vẫn dựng báo cáo trên một bảng không còn tồn tại.
  const r = compareFingerprint(fp, { tables: {}, enums: { 'opportunity.nguon': ['FB_ADS', 'GIOI_THIEU'] } });
  assert.equal(r.ok, false);
  assert.deepEqual(r.thieuCot, ['_class.id', '_class.maLopHoc']);
});

test('compareFingerprint: live thiếu hẳn khoá enums vẫn phát hiện được lệch', () => {
  const r = compareFingerprint(fp, { tables: { _class: ['id', 'maLopHoc'] } });
  assert.equal(r.ok, false);
  assert.deepEqual(r.enumLech, ['opportunity.nguon']);
});
