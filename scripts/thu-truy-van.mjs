#!/usr/bin/env node
// Script DEV: đối chiếu số đếm qua Model với đếm thẳng bằng SQL. Không phải phần của plugin.
//   MB_USER=... MB_PASS=... MB_URL=http://localhost:3001 MB_WS=workspace_1wgvd1injqtife6y4rvfbu3h5 \
//     node scripts/thu-truy-van.mjs
import { createMetabase } from '../plugin/mcp/metabase.mjs';
import { resolveModelId, runModelQuery, runSql } from '../plugin/mcp/query.mjs';

const { MB_URL, MB_USER, MB_PASS, MB_WS } = process.env;
if (!MB_URL || !MB_USER || !MB_PASS || !MB_WS) {
  throw new Error('Cần đủ biến môi trường MB_URL, MB_USER, MB_PASS, MB_WS');
}
const DB = Number(process.env.MB_DB || 2);

const mb = createMetabase({ baseUrl: MB_URL });
await mb.login(MB_USER, MB_PASS);

const modelId = await resolveModelId(mb, 'XLeaders – Models', 'Ghi danh (HV theo lớp)');
const qua_model = (await runModelQuery(mb, { databaseId: DB, modelId, aggregation: [['count']] })).rows[0][0];
const qua_sql = (await runSql(mb, { databaseId: DB,
  sql: `select count(*) from "${MB_WS}"."_enrollment" where "deletedAt" is null` })).rows[0][0];

console.log(`qua Model: ${qua_model}\nqua SQL  : ${qua_sql}`);
console.log(Number(qua_model) === Number(qua_sql) ? '✓ KHỚP' : '✗ LỆCH — dừng lại, tìm nguyên nhân');
process.exit(Number(qua_model) === Number(qua_sql) ? 0 : 1);
