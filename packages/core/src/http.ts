/** Fetch with a timeout and a browser-like UA. Blockscout on this chain sits behind Cloudflare and rejects default fetch UAs. */

export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 Greenwood/0.2 (+https://github.com/SarutobiSasuke8/greenwood)";

export class HttpError extends Error {
  constructor(
    public readonly url: string,
    public readonly status: number,
    message?: string,
  ) {
    super(message ?? `HTTP ${status} from ${url}`);
    this.name = "HttpError";
  }
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = 12_000, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        "user-agent": USER_AGENT,
        accept: "application/json, text/html;q=0.8, */*;q=0.5",
        ...(rest.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const res = await fetchWithTimeout(url, init);
  if (!res.ok) throw new HttpError(url, res.status);
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("json")) {
    // Cloudflare challenge pages come back 200 text/html. Treat as an error, never as data.
    throw new HttpError(url, res.status, `Expected JSON from ${url}, got ${type || "unknown content type"}`);
  }
  return (await res.json()) as T;
}

export function nowIso(): string {
  return new Date().toISOString();
}
