/**
 * A fail-closed network for tests. Test support only; nothing in the app imports this.
 *
 * `installFixtureNetwork()` replaces `globalThis.fetch` (which the providers and viem's HTTP
 * transport both use) with a router over the recorded fixtures. Any request it does not
 * recognise is refused and recorded in `unexpected`, so a test that leaks a real RPC,
 * Blockscout, DexScreener or website call fails instead of silently going to the network.
 */
import { listRecords } from "../registry.js";
import {
  BLOCKSCOUT_CHALLENGE_HTML,
  BLOCKSCOUT_SEARCH,
  BLOCKSCOUT_STATS,
  BLOCKSCOUT_TOKENS,
  DEXSCREENER_TOKENS,
  RPC_BLOCK_NUMBER,
  blockscoutHolders,
} from "./fixtures.js";

export type FixtureProvider = "dexscreener" | "blockscout" | "holders" | "rpc" | "liveness";

export interface FixtureNetworkOptions {
  /** Providers that should fail. Blockscout fails with the recorded Cloudflare challenge (403 HTML). */
  fail?: FixtureProvider[];
}

export interface FixtureNetwork {
  /** Every URL requested, in order. */
  calls: string[];
  /** Requests that matched no fixture. Should always be empty. */
  unexpected: string[];
  /** Change which providers fail without reinstalling. */
  setFailures(fail: FixtureProvider[]): void;
  restore(): void;
}

const RPC_HOST = "rpc.mainnet.chain.robinhood.com";
const BLOCKSCOUT_HOST = "robinhoodchain.blockscout.com";
const DEXSCREENER_HOST = "api.dexscreener.com";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function websiteStatuses(): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of listRecords()) {
    if (!r.website) continue;
    out.set(new URL(r.website).host, r.status === "live" ? 200 : 404);
  }
  return out;
}

async function rpcReply(init: RequestInit | undefined, failing: boolean): Promise<Response> {
  if (failing) return new Response("upstream unavailable", { status: 503, headers: { "content-type": "text/plain" } });
  const raw = typeof init?.body === "string" ? init.body : "";
  const parsed: unknown = raw ? JSON.parse(raw) : null;
  const answer = (req: { id: unknown; method: string }) =>
    req.method === "eth_blockNumber"
      ? { jsonrpc: "2.0", id: req.id, result: RPC_BLOCK_NUMBER }
      : req.method === "eth_chainId"
        ? { jsonrpc: "2.0", id: req.id, result: "0x1237" }
        : { jsonrpc: "2.0", id: req.id, error: { code: -32601, message: `${req.method} is not recorded in the fixtures` } };
  return json(Array.isArray(parsed) ? parsed.map(answer) : answer(parsed as { id: unknown; method: string }));
}

export function installFixtureNetwork(opts: FixtureNetworkOptions = {}): FixtureNetwork {
  const original = globalThis.fetch;
  let failing = new Set<FixtureProvider>(opts.fail ?? []);
  const sites = websiteStatuses();
  const calls: string[] = [];
  const unexpected: string[] = [];

  const stub = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const href = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push(href);
    const url = new URL(href);

    if (url.host === DEXSCREENER_HOST && url.pathname.startsWith("/tokens/v1/robinhood/")) {
      if (failing.has("dexscreener")) return new Response("Internal Server Error", { status: 500, headers: { "content-type": "text/plain" } });
      const wanted = new Set(url.pathname.split("/").pop()!.split(",").map((a) => a.toLowerCase()));
      return json(DEXSCREENER_TOKENS.filter((p) => wanted.has(p.baseToken.address.toLowerCase())));
    }

    if (url.host === BLOCKSCOUT_HOST && url.pathname.startsWith("/api/v2/")) {
      const holders = url.pathname.match(/^\/api\/v2\/tokens\/(0x[0-9a-fA-F]{40})\/holders$/);
      if (holders) {
        if (failing.has("holders") || failing.has("blockscout")) return new Response("failure", { status: 500 });
        const body = blockscoutHolders(holders[1]!);
        return body ? json(body) : json({ message: "Not found" }, 404);
      }
      if (failing.has("blockscout")) return new Response(BLOCKSCOUT_CHALLENGE_HTML, { status: 403, headers: { "content-type": "text/html; charset=UTF-8" } });
      const token = url.pathname.match(/^\/api\/v2\/tokens\/(0x[0-9a-fA-F]{40})$/);
      if (token) {
        const body = BLOCKSCOUT_TOKENS[token[1]!.toLowerCase()];
        return body ? json(body) : json({ message: "Not found" }, 404);
      }
      if (url.pathname === "/api/v2/stats") return json(BLOCKSCOUT_STATS);
      if (url.pathname === "/api/v2/search") {
        const q = (url.searchParams.get("q") ?? "").toLowerCase();
        return json(BLOCKSCOUT_SEARCH[q] ?? { items: [], next_page_params: null });
      }
    }

    if (url.host === RPC_HOST) return rpcReply(init, failing.has("rpc"));

    const site = sites.get(url.host);
    if (site !== undefined) {
      if (failing.has("liveness")) throw new TypeError("fetch failed", { cause: { code: "ECONNREFUSED" } });
      return new Response(site === 200 ? "<!doctype html><title>fixture</title>" : "Not found", { status: site, headers: { "content-type": "text/html" } });
    }

    unexpected.push(href);
    throw new Error(`Unexpected network call in test: ${href}`);
  };

  globalThis.fetch = stub as typeof fetch;
  return {
    calls,
    unexpected,
    setFailures(fail) {
      failing = new Set(fail);
    },
    restore() {
      globalThis.fetch = original;
    },
  };
}
