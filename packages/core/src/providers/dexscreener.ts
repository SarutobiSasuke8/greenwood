import { fetchJson } from "../http.js";
import type { Address, MarketData } from "../types.js";

const BASE = "https://api.dexscreener.com";
const CHAIN = "robinhood";

interface DsPair {
  chainId: string;
  dexId: string;
  labels?: string[];
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

const finite = (n: unknown, signed = false): number | null => { const v = typeof n === "string" && n.trim() !== "" ? Number(n) : n; return typeof v === "number" && Number.isFinite(v) && (signed || v >= 0) ? v : null; };
const address = (s: unknown): s is Address => typeof s === "string" && /^0x[0-9a-f]{40}$/i.test(s);

// Uniswap v4 uses bytes32 pool IDs; token contracts remain 20-byte addresses.
const poolId = (p: DsPair): boolean => address(p.pairAddress) || (p.dexId === 'uniswap' && Array.isArray(p.labels) && p.labels.includes('v4') && typeof p.pairAddress === 'string' && /^0x[0-9a-f]{64}$/i.test(p.pairAddress));

function toMarket(p: DsPair): MarketData {
  return {
    priceUsd: finite(p.priceUsd),
    priceChange24h: finite(p.priceChange?.h24, true),
    volume24hUsd: finite(p.volume?.h24),
    liquidityUsd: finite(p.liquidity?.usd),
    fdvUsd: finite(p.fdv),
    marketCapUsd: finite(p.marketCap),
    txns24h: p.txns?.h24 && finite(p.txns.h24.buys) !== null && finite(p.txns.h24.sells) !== null ? p.txns.h24 : null,
    pairAddress: p.pairAddress as Address,
    pairCreatedAt: finite(p.pairCreatedAt) !== null && p.pairCreatedAt! <= Date.now() ? new Date(p.pairCreatedAt!).toISOString() : null,
    dex: p.dexId ?? null,
    quoteSymbol: p.quoteToken?.symbol ?? null,
    dexscreenerUrl: `https://dexscreener.com/${CHAIN}/${p.pairAddress}`,
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
    if (!Array.isArray(pairs)) throw new Error('Malformed market response');
    const requested = new Set(batch.map(a => a.toLowerCase()));
    for (const p of pairs) {
      if (!p || p.chainId !== CHAIN || !address(p.baseToken?.address) || !poolId(p)) throw new Error('Market response identity mismatch');
      if (!requested.has(p.baseToken.address.toLowerCase())) continue;
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
  const p = res.pairs?.find(p => p.chainId === CHAIN && p.pairAddress.toLowerCase() === pair.toLowerCase());
  return p ? toMarket(p) : null;
}
