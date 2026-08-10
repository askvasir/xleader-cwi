// HTTP client cho Metabase. Chỉ biết giao thức HTTP + phiên — không biết guardrail, không biết từ điển.
// Khung api() mượn nguyên từ metabase/build-*.mjs của xleaders-crm-app (đã chạy ổn định).

export class MetabaseError extends Error {
  constructor(message, status, body) { super(message); this.name = 'MetabaseError'; this.status = status; this.body = body; }
}

export function createMetabase({ baseUrl, fetchImpl = globalThis.fetch }) {
  let session = null;

  async function api(path, { method = 'GET', body } = {}) {
    const res = await fetchImpl(baseUrl + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(session ? { 'X-Metabase-Session': session } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
    if (!res.ok) {
      const msg = (json && (json.message || json.error)) || (typeof json === 'string' ? json : JSON.stringify(json));
      throw new MetabaseError(`${method} ${path} → ${res.status}: ${String(msg).slice(0, 300)}`, res.status, json);
    }
    return json;
  }

  return {
    api,
    setSession(t) { session = t; },
    getSession() { return session; },
    async login(email, password) {
      const r = await api('/api/session', { method: 'POST', body: { username: email, password } });
      session = r.id;
      return session;
    },
    me() { return api('/api/user/current'); },
  };
}
