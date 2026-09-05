import { fetchJson } from "../http.js";
import type { Address, MarketData } from "../types.js";

const BASE = "https://api.dexscreener.com";
const CHAIN = "robinhood";

interface DsPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  txns?: { h24?: { buys: number; sells: number } };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
}

function toMarket(p: DsPair): MarketData {
  return {
    priceUsd: p.priceUsd ? Number(p.priceUsd) : null,
    priceChange24h: p.priceChange?.h24 ?? null,
    volume24hUsd: p.volume?.h24 ?? null,
    liquidityUsd: p.liquidity?.usd ?? null,
    fdvUsd: p.fdv ?? null,
    marketCapUsd: p.marketCap ?? null,
    txns24h: p.txns?.h24 ?? null,
    pairAddress: p.pairAddress as Address,
    pairCreatedAt: p.pairCreatedAt ? new Date(p.pairCreatedAt).toISOString() : null,
    dex: p.dexId ?? null,
    quoteSymbol: p.quoteToken?.symbol ?? null,
    dexscreenerUrl: p.url ?? null,
  };
}

/**
 * Market data for a set of token addresses. Returns a map keyed by lower-cased token
 * address. Tokens with no pair are simply absent, which callers must treat as
 * "no market", never as "price unchanged".
 */
export async function marketByTokens(addresses: Address[]): Promise<Map<string, MarketData>> {
  const out = new Map<string, MarketData>();
  if (addresses.length === 0) return out;
  // The endpoint accepts up to 30 addresses per call.
  for (let i = 0; i < addresses.length; i += 30) {
    const batch = addresses.slice(i, i + 30);
    const pairs = await fetchJson<DsPair[]>(`${BASE}/tokens/v1/${CHAIN}/${batch.join(",")}`);
    for (const p of pairs) {
      if (p.chainId !== CHAIN) continue;
      const key = p.baseToken.address.toLowerCase();
      const existing = out.get(key);
      // Keep the deepest pool per token.
      if (!existing || (p.liquidity?.usd ?? 0) > (existing.liquidityUsd ?? 0)) out.set(key, toMarket(p));
    }
  }
  return out;
}

export async function marketByPair(pair: Address): Promise<MarketData | null> {
  const res = await fetchJson<{ pairs: DsPair[] | null }>(`${BASE}/latest/dex/pairs/${CHAIN}/${pair}`);
  const p = res.pairs?.[0];
  return p ? toMarket(p) : null;
}
