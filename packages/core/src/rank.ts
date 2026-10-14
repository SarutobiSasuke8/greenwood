import type { GameSnapshot, ListingStatus } from "./types.js";

/**
 * Ranking for the index, the API and the MCP list tool.
 *
 * The default order is the screen total, so the build is ranked before the token
 * is priced. Market-led orders exist only when a caller asks for them. Unknown
 * values (a null total, a missing pool, a failed provider) always sort last and
 * are never treated as zero or as "unchanged".
 */

export const RANK_SORTS = ["screen", "liquidity", "holders", "change"] as const;
export type RankSort = (typeof RANK_SORTS)[number];

export interface RankOptions {
  status?: ListingStatus | string | null;
  /** Keep only games whose screen total is at or above this. Null totals never pass. */
  minScreen?: number;
  /** Unknown sort keys fall back to `screen`. */
  sort?: RankSort | string | null;
}

const known = (v: number | null | undefined): number => (v === null || v === undefined || Number.isNaN(v) ? -Infinity : v);

function sortValue(s: GameSnapshot, sort: RankSort): number {
  switch (sort) {
    case "liquidity":
      return known(s.market?.liquidityUsd);
    case "holders":
      return known(s.token?.holders);
    case "change":
      return known(s.market?.priceChange24h);
    default:
      return known(s.screen.total);
  }
}

export function isRankSort(v: unknown): v is RankSort {
  return typeof v === "string" && (RANK_SORTS as readonly string[]).includes(v);
}

/** Filters and orders snapshots. Stable: ties keep registry order. Never mutates the input. */
export function rankGames(snaps: readonly GameSnapshot[], opts: RankOptions = {}): GameSnapshot[] {
  const sort: RankSort = isRankSort(opts.sort) ? opts.sort : "screen";
  let out = [...snaps];
  if (opts.status) out = out.filter((g) => g.record.status === opts.status);
  if (opts.minScreen !== undefined) {
    const min = opts.minScreen;
    out = out.filter((g) => g.screen.total !== null && g.screen.total >= min);
  }
  return out.sort((a, b) => {
    const av = sortValue(a, sort);
    const bv = sortValue(b, sort);
    if (av === bv) return 0;
    return bv > av ? 1 : -1;
  });
}
