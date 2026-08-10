import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const CONFIG_DIR = join(homedir(), '.xleader-cwi');

export function makeConfigStore(dir = CONFIG_DIR) {
  const doc = (f) => join(dir, f);
  const docJson = (f) => { try { return JSON.parse(readFileSync(doc(f), 'utf8')); } catch { return null; } };
  return {
    dir,
    async readConfig() { return docJson('config.json'); },
    async writeConfig(obj) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(doc('config.json'), JSON.stringify(obj, null, 2) + '\n');
    },
    async readSession() { return docJson('session.json')?.session ?? null; },
    async writeSession(token) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(doc('session.json'), JSON.stringify({ session: token }) + '\n', { mode: 0o600 });
    },
  };
}
