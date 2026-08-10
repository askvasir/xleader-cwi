import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { createRpcServer } from '../plugin/mcp/rpc.mjs';

function harness(tools, onCall) {
  const input = new PassThrough();
  const out = [];
  const output = { write: (s) => out.push(JSON.parse(s)) };
  const srv = createRpcServer({ name: 't', version: '0', tools, onCall, input, output });
  srv.start();
  const send = (msg) => new Promise((r) => { input.write(JSON.stringify(msg) + '\n'); setImmediate(r); });
  return { send, out };
}

test('initialize trả serverInfo và capabilities.tools', async () => {
  const { send, out } = harness([], async () => '');
  await send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } });
  assert.equal(out[0].id, 1);
  assert.equal(out[0].result.serverInfo.name, 't');
  assert.ok(out[0].result.capabilities.tools);
});

test('tools/list trả đúng danh sách tool', async () => {
  const tools = [{ name: 'a', description: 'mô tả a', inputSchema: { type: 'object', properties: {} } }];
  const { send, out } = harness(tools, async () => '');
  await send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert.deepEqual(out[0].result.tools, tools);
});

test('tools/call trả nội dung text từ onCall', async () => {
  const { send, out } = harness([], async (name, args) => `chào ${args.ten}`);
  await send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'x', arguments: { ten: 'Huế' } } });
  assert.equal(out[0].result.content[0].text, 'chào Huế');
  assert.ok(!out[0].result.isError);
});

test('onCall ném lỗi → isError true và giữ nguyên thông điệp tiếng Việt', async () => {
  const { send, out } = harness([], async () => { throw new Error('Không có quyền sửa báo cáo chung.'); });
  await send({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'x', arguments: {} } });
  assert.equal(out[0].result.isError, true);
  assert.match(out[0].result.content[0].text, /Không có quyền sửa báo cáo chung\./);
});

test('request() gửi request ra client và giải quyết khi có phản hồi', async () => {
  const { send, out } = harness([], async () => '');
  const srvOut = [];
  const input = new PassThrough();
  const srv = createRpcServer({ name: 't', version: '0', tools: [], onCall: async () => '',
    input, output: { write: (s) => srvOut.push(JSON.parse(s)) } });
  srv.start();
  const p = srv.request('elicitation/create', { mode: 'form' });
  const sent = srvOut[0];
  assert.equal(sent.method, 'elicitation/create');
  input.write(JSON.stringify({ jsonrpc: '2.0', id: sent.id, result: { action: 'accept', content: { ok: 1 } } }) + '\n');
  assert.deepEqual(await p, { action: 'accept', content: { ok: 1 } });
});

test('phương thức lạ trả lỗi -32601', async () => {
  const { send, out } = harness([], async () => '');
  await send({ jsonrpc: '2.0', id: 9, method: 'khong/ton/tai' });
  assert.equal(out[0].error.code, -32601);
});
