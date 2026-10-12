/** Bounded provider requests. The deadline includes the response body. */
export const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36 Greenwood/0.3";
export class HttpError extends Error {
  constructor(public readonly url: string, public readonly status: number, message?: string) {
    super(message ?? `HTTP ${status} from ${url}`); this.name = "HttpError";
  }
}
type FetchOptions = RequestInit & { timeoutMs?: number; maxBytes?: number; headersOnly?: boolean };
export async function fetchWithTimeout(url: string, init: FetchOptions = {}): Promise<Response> {
  const { timeoutMs = 12_000, maxBytes = 5_000_000, headersOnly = false, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(rest.headers);
  if (!headers.has('user-agent')) headers.set('user-agent', USER_AGENT);
  if (!headers.has('accept')) headers.set('accept', 'application/json, text/html;q=0.8, */*;q=0.5');
  try {
    const response = await fetch(url, { ...rest, headers, signal: rest.signal ? AbortSignal.any([rest.signal, controller.signal]) : controller.signal });
    if (headersOnly) { await response.body?.cancel(); return response; }
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > maxBytes) { controller.abort(); throw new HttpError(url, response.status, 'Provider response exceeds size limit'); }
        chunks.push(value);
      }
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new Response([204,205,304].includes(response.status) ? null : bytes, { status: response.status, statusText: response.statusText, headers: response.headers });
  } finally { clearTimeout(timer); }
}
export async function fetchJson<T>(url: string, init?: FetchOptions): Promise<T> {
  const res = await fetchWithTimeout(url, init);
  if (!res.ok) throw new HttpError(url, res.status);
  const type = res.headers.get('content-type') ?? '';
  if (!type.includes('json')) throw new HttpError(url, res.status, `Expected JSON, got ${type || 'unknown content type'}`);
  return await res.json() as T;
}
export function nowIso(): string { return new Date().toISOString(); }
