import type { Flag, GameRecord, Liveness, MarketData, Screen, ScreenCriterion, TokenData, SourceStatus } from "./types.js";

/**
 * The Greenwood screen. Five criteria, fixed weights, every number traceable to a
 * basis string. The question it answers is not "is it fun" but "is this a game,
 * or a ticker with art". On a chain where 93% of accounts have only ever touched
 * memecoins, that is the field that protects a player.
 */

export const WEIGHTS = { build: 0.3, team: 0.15, liquidity: 0.2, spread: 0.15, ticker: 0.2 } as const;

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function scoreBuild(record: GameRecord, live: Liveness | null): ScreenCriterion {
  const siteUp = live?.ok === true;
  if (record.website && (live?.ok == null || live.httpStatus == null || [403,429].includes(live.httpStatus) || live.httpStatus >= 500)) {
    return { key: 'build', label: 'Playable build', score: null, weight: WEIGHTS.build, basis: 'Website check unavailable or skipped. Manual gameplay evidence remains separate.', estimated: false };
  }
  let score = 0;
  let basis: string;
  if (!record.website) {
    basis = "No website on record.";
  } else if (!siteUp) {
    basis = `Site did not serve a page (${live?.detail ?? "no response"}).`;
  } else if (record.playable === true) {
    score = 100;
    basis = "Site live and a playable build was verified without holding the token.";
  } else if (record.playable === null) {
    score = 55;
    basis = "Site live; playability not yet established by hand.";
  } else {
    score = 30;
    basis = "Site live, but nothing playable was found behind it.";
  }
  if (record.tokenGated && score > 0) {
    score -= 25;
    basis += " Entry requires holding the token.";
  }
  return { key: "build", label: "Playable build", score: clamp(score), weight: WEIGHTS.build, basis, estimated: false };
}

export function scoreTeam(record: GameRecord): ScreenCriterion {
  const map: Record<number, [number, string]> = {
    0: [10, "No named person or entity recorded in this directory."],
    1: [45, "Pseudonymous handles only; no legal entity."],
    2: [75, "Named individuals, no company entity."],
    3: [95, "Named company or legal entity behind the project."],
  };
  const [score, basis] = map[record.teamVisibility] ?? map[0]!;
  return { key: "team", label: "Team visibility", score, weight: WEIGHTS.team, basis, estimated: false };
}

export function scoreLiquidity(market: MarketData | null, source?: SourceStatus): ScreenCriterion {
  const usd = market?.liquidityUsd ?? null;
  let score: number;
  let basis: string;
  if ((source && source.state !== 'ok') || (market && usd === null) || (!market && source?.state !== 'ok')) return { key:'liquidity', label:'Liquidity depth', score:null, weight:WEIGHTS.liquidity, basis: source?.state === 'error' ? 'Market provider unavailable; no conclusion about pool existence.' : 'Liquidity observation unavailable; this is not observed zero.', estimated:false };
  if (usd === null) {
    score = 0;
    basis = "The successful provider lookup returned no indexed pool for this attested token.";
  } else if (usd < 100) {
    score = 0;
    basis = `Pool holds ${fmtUsd(usd)}. Below the $100 headline-quote threshold.`;
  } else if (usd < 10_000) {
    score = 20;
    basis = `Pool holds ${fmtUsd(usd)}. Low observed pool liquidity.`;
  } else if (usd < 50_000) {
    score = 45;
    basis = `Pool holds ${fmtUsd(usd)}. Observed pool liquidity.`;
  } else if (usd < 250_000) {
    score = 70;
    basis = `Pool holds ${fmtUsd(usd)}.`;
  } else {
    score = 95;
    basis = `Pool holds ${fmtUsd(usd)}. Observed pool liquidity.`;
  }
  return { key: "liquidity", label: "Liquidity depth", score, weight: WEIGHTS.liquidity, basis, estimated: false };
}

export function scoreSpread(token: TokenData | null): ScreenCriterion {
  if (!token) {
    return { key: "spread", label: "Holder spread", score: null, weight: WEIGHTS.spread, basis: "No attested token contract, so no holders to measure.", estimated: false };
  }
  if (token.top10Share !== null) {
    const pct = token.top10Share * 100;
    const score = pct <= 20 ? 95 : pct <= 35 ? 75 : pct <= 50 ? 50 : pct <= 70 ? 25 : 10;
    return { key: "spread", label: "Holder spread", score, weight: WEIGHTS.spread, basis: `Top ten addresses hold ${pct.toFixed(1)}% of supply.`, estimated: false };
  }
  const h = token.holders;
  if (h === null) {
    return { key: "spread", label: "Holder spread", score: null, weight: WEIGHTS.spread, basis: "Holder data unavailable from the explorer.", estimated: true };
  }
  const score = null;
  return { key: "spread", label: "Holder spread", score, weight: WEIGHTS.spread, basis: `${h.toLocaleString("en-GB")} holders. Holder count does not establish concentration; this criterion is unavailable.`, estimated: true };
}

export function scoreTicker(record: GameRecord): ScreenCriterion {
  if (!record.ticker) {
    return { key: "ticker", label: "Ticker clarity", score: 0, weight: WEIGHTS.ticker, basis: "No ticker.", estimated: false };
  }
  const n = record.tickerCollisions;
  const score = n === 0 ? 95 : n === 1 ? 60 : n === 2 ? 35 : 15;
  const basis =
    n === 0
      ? `${record.ticker} identifies one project on this chain.`
      : `${record.ticker} is shared with ${n} other ${n === 1 ? "project or contract" : "projects or contracts"}. A buyer searching the ticker cannot tell which one they hold.`;
  const attested = record.tokenAddress ? "" : " No attested contract for this project.";
  return { key: "ticker", label: "Ticker clarity", score: record.tokenAddress ? score : Math.min(score, 30), weight: WEIGHTS.ticker, basis: basis + attested, estimated: false };
}

export function deriveFlags(record: GameRecord, market: MarketData | null, token: TokenData | null, live: Liveness | null, partial: boolean, source?: SourceStatus): Flag[] {
  const flags: Flag[] = [];
  if (record.status === "pre-launch") flags.push({ label: "Pre-launch", severity: "caution", reason: "Nothing shipped yet." });
  if (record.playable === true) flags.push({ label: "Playable", severity: "good", reason: `A build was checked by hand on ${record.lastVerified}.` });
  if (record.website && live?.ok === false && [404,410].includes(live.httpStatus ?? 0)) flags.push({ label: "Website unavailable", severity: "risk", reason: live.detail ?? "Official site did not respond." });
  if (record.tokenGated) flags.push({ label: "Token-gated", severity: "caution", reason: "You must hold the token to play." });
  if (record.tokenAddress && market && market.liquidityUsd !== null && market.liquidityUsd < 100) flags.push({ label: market.liquidityUsd === 0 ? "Zero pool liquidity" : "Very low liquidity", severity: "risk", reason: "Under 100 USD of liquidity remains in the best pool." });
  else if (market && market.liquidityUsd !== null && market.liquidityUsd < 10_000) flags.push({ label: "Thin liquidity", severity: "caution", reason: `Best pool holds ${fmtUsd(market.liquidityUsd)}.` });
  if (record.tokenAddress && !market && source?.state === "ok") flags.push({ label: "No indexed pool", severity: "caution", reason: "Token exists but no pool is indexed." });
  if (record.tickerCollisions >= 2) flags.push({ label: "Ticker collision", severity: "risk", reason: `${record.tickerCollisions + 1} projects or contracts share ${record.ticker}.` });
  else if (record.tickerCollisions === 1) flags.push({ label: "Ticker shared", severity: "caution", reason: `One other contract uses ${record.ticker}.` });
  if (record.tokenAddress === null && record.status !== "pre-launch" && record.ticker) flags.push({ label: "Unattested token", severity: "risk", reason: "No contract can be tied to this project." });
  if (record.teamVisibility === 0 && record.status !== "pre-launch") flags.push({ label: "Team identity unrecorded", severity: "caution", reason: "No named person or entity confirmed in the directory evidence." });
  if (token?.top10Share !== null && token?.top10Share !== undefined && token.top10Share > 0.5) flags.push({ label: `Top 10 hold ${(token.top10Share * 100).toFixed(0)}%`, severity: "risk", reason: "Top-address concentration; addresses may include pools, bridges or custodians." });
  if (partial) flags.push({ label: "Partial data", severity: "caution", reason: "At least one applicable observation failed, was unavailable or was skipped. Missing fields are shown as missing, never backfilled." });
  return flags;
}

export function buildScreen(record: GameRecord, market: MarketData | null, token: TokenData | null, live: Liveness | null, partial: boolean, source?: SourceStatus): Screen {
  const flags = deriveFlags(record, market, token, live, partial, source);
  if (record.status === "pre-launch") {
    return { total: null, band: "unscreened", coverage: { observed:0, required:5 }, criteria: [], flags };
  }
  const criteria = [scoreBuild(record, live), scoreTeam(record), scoreLiquidity(market, source), scoreSpread(token), scoreTicker(record)];
  const coverage = { observed: criteria.filter(c => c.score !== null).length, required: criteria.length };
  if (partial || coverage.observed < coverage.required) return { total:null, band:'unscreened', coverage, criteria, flags };
  const total = clamp(criteria.reduce((acc, c) => acc + (c.score ?? 0) * c.weight, 0));
  const band = total >= 65 ? "sound" : total >= 45 ? "watch" : "avoid";
  return { total, band, coverage, criteria, flags };
}

export function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M USD`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K USD`;
  return `${n.toFixed(n < 1 ? 4 : 0)} USD`;
}
