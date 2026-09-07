import { fetchWithTimeout } from "../http.js";
import type { Liveness } from "../types.js";

/**
 * One request per listing. Half the incumbent's roster points at domains that do
 * not serve a page; this is the check that would have caught every one of them.
 */
export async function checkSite(url: string): Promise<Liveness> {
  const started = Date.now();
  try {
    const res = await fetchWithTimeout(url, { method: "GET", redirect: "follow", timeoutMs: 10_000, headersOnly: true });
    const latencyMs = Date.now() - started;
    // Platform "app not found" pages return 200/404 with a body; a 2xx/3xx is the bar here.
    const ok = res.status >= 200 && res.status < 400 ? true : [404, 410].includes(res.status) ? false : null;
    return { url, ok, httpStatus: res.status, latencyMs, detail: ok ? undefined : `HTTP ${res.status}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code = (err as { cause?: { code?: string } })?.cause?.code;
    return { url, ok: null, httpStatus: null, latencyMs: null, detail: code ?? message };
  }
}
