import type { GameSnapshot } from "@greenwood/core";

export const MARKET_MAX_AGE_MS = 600_000;
export const finite = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n);

/** Presentation eligibility only. Raw core/API observations and scoring are unchanged. */
export function marketView(s: GameSnapshot, now: number, failed = false) {
  const source = s.sources.dexscreener;
  const timestamp = Date.parse(source.fetchedAt ?? "");
  const fresh = Number.isFinite(timestamp) && now - timestamp >= -60_000 && now - timestamp < MARKET_MAX_AGE_MS;
  let reason = "";
  if (failed) reason = "Refresh unavailable";
  else if (!s.record.tokenAddress) reason = "Contract unconfirmed";
  else if (source.state !== "ok") reason = "Market data unavailable";
  else if (!fresh) reason = "Awaiting a fresh quote";
  else if (!s.market) reason = "No indexed pool returned";
  else if (!finite(s.market.liquidityUsd)) reason = "Liquidity unavailable";
  else if (s.market.liquidityUsd < 100) reason = "Insufficient pool liquidity";
  else if (!finite(s.market.priceUsd) || s.market.priceUsd <= 0) reason = "Quote unavailable";
  const eligible = !reason;
  const readable = !failed && fresh && source.state === "ok" && !!s.record.tokenAddress;
  return {
    eligible, reason, fresh,
    price: eligible ? s.market!.priceUsd : null,
    change: eligible && finite(s.market?.priceChange24h) ? s.market!.priceChange24h : null,
    liquidity: readable && finite(s.market?.liquidityUsd) && s.market!.liquidityUsd! >= 0 ? s.market!.liquidityUsd : null,
    volume: readable && finite(s.market?.volume24hUsd) && s.market!.volume24hUsd! >= 0 ? s.market!.volume24hUsd : null,
    timestamp: source.fetchedAt,
  };
}
