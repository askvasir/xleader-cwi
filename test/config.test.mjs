import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeConfigStore } from '../plugin/mcp/config.mjs';

test('chưa cấu hình thì readConfig trả null', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cwi-'));
  const s = makeConfigStore(dir);
  assert.equal(await s.readConfig(), null);
  rmSync(dir, { recursive: true, force: true });
});

test('ghi rồi đọc lại đúng nội dung', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cwi-'));
  const s = makeConfigStore(dir);
  await s.writeConfig({ email: 'a@b.c', myUserId: 3, personalCollectionId: 108, cwiCollectionId: 130 });
  assert.equal((await s.readConfig()).cwiCollectionId, 130);
  rmSync(dir, { recursive: true, force: true });
});

test('session.json phải có quyền 0600', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cwi-'));
  const s = makeConfigStore(dir);
  await s.writeSession('sess-abc');
  assert.equal(statSync(join(dir, 'session.json')).mode & 0o777, 0o600);
  assert.equal(await s.readSession(), 'sess-abc');
  rmSync(dir, { recursive: true, force: true });
});

test('file session hỏng thì trả null chứ không ném lỗi', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cwi-'));
  const s = makeConfigStore(dir);
  const { writeFileSync } = await import('node:fs');
  writeFileSync(join(dir, 'session.json'), 'không phải json');
  assert.equal(await s.readSession(), null);
  rmSync(dir, { recursive: true, force: true });
});
