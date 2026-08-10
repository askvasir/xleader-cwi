#!/usr/bin/env node
import { createRpcServer } from './rpc.mjs';

const TOOLS = [{
  name: 'cwi_ping',
  description: 'Kiểm tra plugin xleader-cwi đã nạp được chưa.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
}];

async function onCall(name) {
  if (name === 'cwi_ping') return 'cwi sẵn sàng';
  throw new Error(`Chưa có công cụ tên "${name}".`);
}

createRpcServer({ name: 'cwi', version: '0.1.0', tools: TOOLS, onCall }).start();
