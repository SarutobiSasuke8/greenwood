import { unstable_cache } from "next/cache";
import { chainStatus, snapshotAll, tickerCollisions, type ChainStatus, type GameSnapshot } from "@greenwood/core";
import { SITE } from "./site";

/**
 * One cached sweep feeds the index, every detail page and the API. Five minutes
 * matches the refresh promise in the footer. A failed provider inside the sweep
 * is recorded per snapshot, never hidden behind a stale cache hit.
 */
export const getSnapshots = unstable_cache(async (): Promise<GameSnapshot[]> => snapshotAll(), ["greenwood:snapshots:v2"], {
  revalidate: SITE.refreshSeconds,
  tags: ["snapshots"],
});

export const getChain = unstable_cache(async (): Promise<ChainStatus> => chainStatus(), ["greenwood:chain:v1"], {
  revalidate: 60,
  tags: ["chain"],
});

export async function getSnapshot(id: string): Promise<GameSnapshot | null> {
  const all = await getSnapshots();
  return all.find((s) => s.record.id === id) ?? null;
}

export function getCollisions() {
  return tickerCollisions();
}

export function sortByScreen(snaps: GameSnapshot[]): GameSnapshot[] {
  return [...snaps].sort((a, b) => (b.screen.total ?? -1) - (a.screen.total ?? -1));
}

export function indexStats(snaps: GameSnapshot[]) {
  const scored = snaps.map((s) => s.screen.total).filter((n): n is number => n !== null).sort((a, b) => a - b);
  const median = scored.length ? scored[Math.floor(scored.length / 2)]! : null;
  return {
    indexed: snaps.length,
    playable: snaps.filter((s) => s.record.playable === true && s.liveness?.ok).length,
    sitesDown: snaps.filter((s) => s.liveness && !s.liveness.ok).length,
    withMarket: snaps.filter((s) => s.market && (s.market.liquidityUsd ?? 0) >= 100).length,
    collisions: snaps.filter((s) => s.record.tickerCollisions >= 1).length,
    medianScreen: median,
    partial: snaps.filter((s) => s.partial).length,
    fetchedAt: snaps[0]?.fetchedAt ?? null,
  };
}
