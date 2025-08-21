export async function apiFetch(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers || {});
    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }
    const resp = await fetch(path, { ...init, headers, credentials: "same-origin" });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`API ${resp.status}: ${text || resp.statusText}`);
    }
    return resp;
  }
  