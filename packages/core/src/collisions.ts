import { listRecords } from "./registry.js";
import type { TickerCollision } from "./types.js";

/** Known name-squatting on the chain, counted from Blockscout on 2026-09-06. */
const CONTRACT_COUNTS: Record<string, { count: number; note: string }> = {
  SENKAI: { count: 6, note: "Blockscout returns at least six distinct Senkai-named ERC-20s." },
  THORNVEIL: { count: 4, note: "Four Thornveil-named contracts for a game that has not launched, one under the Virtuals naming convention." },
  SHERWOOD: { count: 4, note: "Includes Sherwood Protocol, Sherwood Exchange and Sherwood Shark." },
  ROBIN: { count: 3, note: "Three separate projects trade as ROBIN. PLAYHOOD annotates two of the three in its own source." },
};

export function tickerCollisions(): TickerCollision[] {
  const byTicker = new Map<string, { id: string; name: string }[]>();
  for (const r of listRecords()) {
    if (!r.ticker) continue;
    const key = r.ticker.toUpperCase();
    byTicker.set(key, [...(byTicker.get(key) ?? []), { id: r.id, name: r.name }]);
  }
  const out: TickerCollision[] = [];
  for (const [ticker, projects] of byTicker) {
    const known = CONTRACT_COUNTS[ticker];
    if (projects.length > 1 || known) {
      out.push({
        ticker,
        projects,
        contractsOnChain: known?.count ?? null,
        note: known?.note ?? `${projects.length} registry entries share this ticker.`,
      });
    }
  }
  return out.sort((a, b) => (b.contractsOnChain ?? b.projects.length) - (a.contractsOnChain ?? a.projects.length));
}
