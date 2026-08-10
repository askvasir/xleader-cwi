// Giao thức MCP qua stdio, JSON-RPC 2.0, KHÔNG phụ thuộc npm.
// Chỉ biết giao thức — không biết gì về Metabase, guardrail hay từ điển.
import { createInterface } from 'node:readline';

export function createRpcServer({ name, version, tools, onCall, input = process.stdin, output = process.stdout }) {
  const pending = new Map();
  let nextId = 1;
  const send = (msg) => output.write(JSON.stringify(msg) + '\n');

  function request(method, params) {
    const id = `srv-${nextId++}`;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      send({ jsonrpc: '2.0', id, method, params });
    });
  }

  async function handle(msg) {
    // Ba loại thông điệp đến, phân loại theo đúng thứ tự này:
    //   1. response cho request do CHÍNH server gửi đi (có id, KHÔNG method)
    //   2. notification từ client (có method, KHÔNG id)  → xử lý rồi im lặng
    //   3. request từ client (có method + id)            → phải trả lời
    if (msg.method === undefined) {
      // Là response. Khớp được thì giải quyết; LẠC thì bỏ qua IM LẶNG —
      // JSON-RPC cấm "trả lời" một response, tụt xuống switch sẽ bắn ngược lỗi giả.
      const p = pending.get(msg.id);
      if (!p) return;
      pending.delete(msg.id);
      msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
      return;
    }
    switch (msg.method) {
      case 'initialize':
        return send({ jsonrpc: '2.0', id: msg.id, result: {
          protocolVersion: msg.params?.protocolVersion || '2025-06-18',
          capabilities: { tools: {} },
          serverInfo: { name, version },
        }});
      case 'notifications/initialized':
      case 'notifications/cancelled':
        return;
      case 'tools/list':
        return send({ jsonrpc: '2.0', id: msg.id, result: { tools } });
      case 'tools/call': {
        try {
          const text = await onCall(msg.params?.name, msg.params?.arguments || {}, { request });
          return send({ jsonrpc: '2.0', id: msg.id, result: { content: [{ type: 'text', text: String(text) }] } });
        } catch (e) {
          return send({ jsonrpc: '2.0', id: msg.id,
            result: { content: [{ type: 'text', text: e.message }], isError: true } });
        }
      }
      default:
        if (msg.id !== undefined) {
          send({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: `chưa hỗ trợ: ${msg.method}` } });
        }
    }
  }

  return {
    request,
    start() {
      createInterface({ input }).on('line', (line) => {
        if (!line.trim()) return;
        let msg; try { msg = JSON.parse(line); } catch { return; }
        handle(msg).catch((e) => process.stderr.write(`cwi rpc error: ${e.stack}\n`));
      });
    },
  };
}
