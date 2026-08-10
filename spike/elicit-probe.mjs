#!/usr/bin/env node
// Spike: MCP server tối giản, KHÔNG phụ thuộc npm.
// Mục đích: (1) chứng minh giao thức stdio tự viết chạy được với Claude Code,
//           (2) chứng minh elicitation/create hiện được form nhập liệu.
import { createInterface } from 'node:readline';

const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
const pending = new Map();
let nextId = 1;

// Gửi một REQUEST từ server → client và chờ kết quả (đây là cách elicitation hoạt động).
function request(method, params) {
  const id = `srv-${nextId++}`;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    send({ jsonrpc: '2.0', id, method, params });
  });
}

const TOOLS = [{
  name: 'probe_elicit',
  description: 'Thử nghiệm: xin người dùng nhập email + mật khẩu qua form native.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
}];

async function callTool(name) {
  if (name !== 'probe_elicit') throw new Error(`tool lạ: ${name}`);
  const res = await request('elicitation/create', {
    mode: 'form',
    message: 'Nhập thông tin đăng nhập insight (thử nghiệm — sẽ không được lưu)',
    requestedSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', title: 'Email insight' },
        password: { type: 'string', title: 'Mật khẩu', format: 'password' },
      },
      required: ['email', 'password'],
    },
  });
  // KHÔNG in mật khẩu ra. Chỉ báo đã nhận được gì.
  const got = res?.content || {};
  return `action=${res?.action} · nhận được email=${got.email ? 'CÓ' : 'KHÔNG'} · mật khẩu=${got.password ? `CÓ (${String(got.password).length} ký tự)` : 'KHÔNG'}`;
}

createInterface({ input: process.stdin }).on('line', async (line) => {
  if (!line.trim()) return;
  let msg; try { msg = JSON.parse(line); } catch { return; }

  // Phản hồi cho request do CHÍNH server gửi đi (elicitation)
  if (msg.id !== undefined && msg.method === undefined && pending.has(msg.id)) {
    const p = pending.get(msg.id); pending.delete(msg.id);
    msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
    return;
  }

  if (msg.method === 'initialize') {
    send({ jsonrpc: '2.0', id: msg.id, result: {
      protocolVersion: msg.params?.protocolVersion || '2025-06-18',
      capabilities: { tools: {} },
      serverInfo: { name: 'cwi-spike', version: '0.0.1' },
    }});
  } else if (msg.method === 'notifications/initialized') {
    // không cần trả lời
  } else if (msg.method === 'tools/list') {
    send({ jsonrpc: '2.0', id: msg.id, result: { tools: TOOLS } });
  } else if (msg.method === 'tools/call') {
    try {
      const text = await callTool(msg.params?.name);
      send({ jsonrpc: '2.0', id: msg.id, result: { content: [{ type: 'text', text }] } });
    } catch (e) {
      send({ jsonrpc: '2.0', id: msg.id, result: { content: [{ type: 'text', text: `LỖI: ${e.message}` }], isError: true } });
    }
  } else if (msg.id !== undefined) {
    send({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: `chưa hỗ trợ: ${msg.method}` } });
  }
});
