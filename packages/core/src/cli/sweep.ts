#!/usr/bin/env node
/**
 * `pnpm sweep`: prints what the chain says about every registry entry right now.
 * Use it after editing the registry, or on the four-weekly re-check.
 */
import { snapshotAll, chainStatus } from "../index.js";

const chain = await chainStatus();
console.log(`Robinhood Chain (${chain.chainId}) block ${chain.blockNumber ?? "?"} · rpc ${chain.rpc.state} · blockscout ${chain.blockscout.state}\n`);

const snaps = await snapshotAll();
const rows = snaps
  .sort((a, b) => (b.screen.total ?? -1) - (a.screen.total ?? -1))
  .map((s) => ({
    game: s.record.name,
    ticker: s.record.ticker ?? "-",
    screen: s.screen.total ?? "-",
    band: s.screen.band,
    site: s.liveness ? (s.liveness.ok ? `up ${s.liveness.httpStatus}` : `DOWN ${s.liveness.detail ?? ""}`) : "-",
    priceUsd: s.market?.priceUsd ?? null,
    liqUsd: s.market?.liquidityUsd ?? null,
    holders: s.token?.holders ?? null,
    partial: s.partial ? "yes" : "",
  }));
console.table(rows);

for (const s of snaps) {
  const errs = Object.entries(s.sources).filter(([, v]) => v.state === "error");
  if (errs.length) console.log(`! ${s.record.name}: ${errs.map(([k, v]) => `${k}: ${v.detail}`).join(" | ")}`);
}
