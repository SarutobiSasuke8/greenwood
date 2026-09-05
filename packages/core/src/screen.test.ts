import { test } from "node:test";
import assert from "node:assert/strict";
import { buildScreen } from "./screen.js";
import { REGISTRY, getRecord } from "./registry.js";
import { tickerCollisions } from "./collisions.js";
import type { GameRecord, Liveness, MarketData, TokenData } from "./types.js";

const up: Liveness = { url: "https://x", ok: true, httpStatus: 200, latencyMs: 100 };
const down: Liveness = { url: "https://x", ok: false, httpStatus: null, latencyMs: null, detail: "ENOTFOUND" };

const market = (liquidityUsd: number | null): MarketData => ({
  priceUsd: 0.01, priceChange24h: 0, volume24hUsd: 0, liquidityUsd, fdvUsd: null, marketCapUsd: null, txns24h: null,
  pairAddress: "0x0000000000000000000000000000000000000001", pairCreatedAt: null, dex: "uniswap", quoteSymbol: "WETH", dexscreenerUrl: null,
});

const token = (holders: number | null, top10: number | null): TokenData => ({
  address: "0x0000000000000000000000000000000000000002", name: "T", symbol: "T", decimals: 18, totalSupply: "1000", holders, top10Share: top10, explorerUrl: "",
});

test("registry ids are unique and every live entry with a token has evidence", () => {
  const ids = new Set(REGISTRY.map((r) => r.id));
  assert.equal(ids.size, REGISTRY.length);
  for (const r of REGISTRY) {
    if (r.tokenAddress) assert.ok(r.evidence.length >= 1, `${r.id} needs evidence`);
    assert.match(r.lastVerified, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test("a playable game with a real pool outscores a dead site with a drained pool", () => {
  const kindra = getRecord("kindra")!;
  const floor = getRecord("the-floor")!;
  const a = buildScreen(kindra, market(53_000), token(536, 0.3), up, false);
  const b = buildScreen(floor, market(0), token(663, null), up, false);
  assert.ok((a.total ?? 0) > (b.total ?? 0));
  assert.equal(a.band, "sound");
  assert.ok(b.flags.some((f) => f.label === "Pool drained"));
});

test("a down site zeroes the build criterion", () => {
  const r = getRecord("robin-world")!;
  const s = buildScreen(r, market(6_900), token(100, null), down, false);
  assert.equal(s.criteria.find((c) => c.key === "build")?.score, 0);
  assert.ok(s.flags.some((f) => f.label === "Site down"));
});

test("pre-launch entries are unscreened, never scored", () => {
  const r = getRecord("thornveil")!;
  const s = buildScreen(r, null, null, null, false);
  assert.equal(s.total, null);
  assert.equal(s.band, "unscreened");
});

test("partial data is always flagged", () => {
  const r = getRecord("kindra")!;
  const s = buildScreen(r, null, null, up, true);
  assert.ok(s.flags.some((f) => f.label === "Partial data"));
});

test("ticker collisions include ROBIN with three projects", () => {
  const robin = tickerCollisions().find((c) => c.ticker === "ROBIN");
  assert.ok(robin);
  assert.equal(robin.projects.length, 3);
});

test("token-gated entry costs build points", () => {
  const base: GameRecord = { ...getRecord("kindra")!, tokenGated: false };
  const gated: GameRecord = { ...base, tokenGated: true };
  const a = buildScreen(base, market(50_000), token(500, null), up, false);
  const b = buildScreen(gated, market(50_000), token(500, null), up, false);
  assert.ok((a.total ?? 0) > (b.total ?? 0));
});
