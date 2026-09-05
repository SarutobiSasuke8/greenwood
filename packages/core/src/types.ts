/**
 * Shared types for Greenwood.
 *
 * Two layers are kept deliberately separate:
 *  - `GameRecord`   is the attested registry entry. Humans write it, with dated evidence.
 *  - `GameSnapshot` is what the chain says right now, assembled from live providers.
 *
 * Nothing in a snapshot is ever silently backfilled from the registry. If a provider
 * fails, the field is null and the failure is recorded in `sources`. That rule exists
 * because the incumbent hub on this chain displays hardcoded prices when its feed
 * fails, and its most prominent listing is a drained pool shown as its busiest game.
 */

export type Address = `0x${string}`;

export type ListingStatus = "live" | "dormant" | "pre-launch" | "unverified";

/** 0 = fully anonymous, 1 = pseudonymous handles, 2 = named individuals, 3 = named company or entity. */
export type TeamVisibility = 0 | 1 | 2 | 3;

export interface Evidence {
  date: string;
  note: string;
  url?: string;
}

export interface GameRecord {
  id: string;
  name: string;
  ticker: string | null;
  genre: string;
  summary: string;
  website: string | null;
  socials: { x?: string; telegram?: string; discord?: string };
  /** Attested token contract. Null when no project attestation exists, even if candidates are known. */
  tokenAddress: Address | null;
  /** Preferred DEX pair. Null when unknown; providers can still discover one by token address. */
  pairAddress: Address | null;
  status: ListingStatus;
  /** Can a person play it today without first holding the token? null = not established. */
  playable: boolean | null;
  tokenGated: boolean;
  teamVisibility: TeamVisibility;
  /** Distinct unrelated projects or contracts sharing this ticker on the chain, excluding this one. */
  tickerCollisions: number;
  /** Candidate contracts that carry this project's name but lack attestation. Never used for pricing. */
  unattestedContracts: Address[];
  discoveredVia: string;
  evidence: Evidence[];
  verdict: string;
  lastVerified: string;
}

export type ProviderState = "ok" | "error" | "skipped";

export interface SourceStatus {
  state: ProviderState;
  fetchedAt: string | null;
  detail?: string;
}

export interface MarketData {
  priceUsd: number | null;
  priceChange24h: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  fdvUsd: number | null;
  marketCapUsd: number | null;
  txns24h: { buys: number; sells: number } | null;
  pairAddress: Address | null;
  pairCreatedAt: string | null;
  dex: string | null;
  quoteSymbol: string | null;
  dexscreenerUrl: string | null;
}

export interface TokenData {
  address: Address;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  totalSupply: string | null;
  holders: number | null;
  /** Share of total supply held by the top ten holders, 0..1. Null when the holders list was unavailable. */
  top10Share: number | null;
  explorerUrl: string;
}

export interface Liveness {
  url: string;
  ok: boolean;
  httpStatus: number | null;
  latencyMs: number | null;
  detail?: string;
}

export interface ScreenCriterion {
  key: "build" | "team" | "liquidity" | "spread" | "ticker";
  label: string;
  score: number;
  weight: number;
  basis: string;
  estimated: boolean;
}

export interface Screen {
  /** Weighted 0..100. Null for pre-launch entries, which have nothing to screen. */
  total: number | null;
  band: "sound" | "watch" | "avoid" | "unscreened";
  criteria: ScreenCriterion[];
  flags: Flag[];
}

export type FlagSeverity = "good" | "caution" | "risk";

export interface Flag {
  label: string;
  severity: FlagSeverity;
  reason: string;
}

export interface GameSnapshot {
  record: GameRecord;
  market: MarketData | null;
  token: TokenData | null;
  liveness: Liveness | null;
  screen: Screen;
  sources: {
    dexscreener: SourceStatus;
    blockscout: SourceStatus;
    liveness: SourceStatus;
  };
  fetchedAt: string;
  /** True when at least one provider failed. UI must show this. */
  partial: boolean;
}

export interface ChainStatus {
  chainId: number;
  name: string;
  blockNumber: number | null;
  averageBlockTimeMs: number | null;
  totalAddresses: number | null;
  totalBlocks: number | null;
  gasPriceGwei: { slow: number; average: number; fast: number } | null;
  ethPriceUsd: number | null;
  rpc: SourceStatus;
  blockscout: SourceStatus;
  fetchedAt: string;
}

export interface TickerCollision {
  ticker: string;
  projects: { id: string; name: string }[];
  contractsOnChain: number | null;
  note: string;
}

/** Studio-reported in-game economy metrics. This is the ingest contract. */
export interface EconomyReport {
  gameId: string;
  reportedAt: string;
  period: "day" | "week";
  dau: number | null;
  wau: number | null;
  newWallets: number | null;
  /** Token units minted into the game economy over the period (faucets). */
  faucetUnits: number | null;
  /** Token units removed from circulation over the period (sinks). */
  sinkUnits: number | null;
  /** In-game marketplace volume in token units. */
  marketplaceVolumeUnits: number | null;
  /** Optional free-form metrics, kept small and namespaced by the studio. */
  custom?: Record<string, number>;
  source: string;
}
