import { test } from "node:test";
import assert from "node:assert/strict";
import { buildScreen } from "./screen.js";
import { REGISTRY, getRecord } from "./registry.js";
import { tickerCollisions } from "./collisions.js";
import type { GameRecord, Liveness, MarketData, TokenData } from "./types.js";

const up: Liveness = { url: "https://x", ok: true, httpStatus: 200, latencyMs: 100 };
const down: Liveness = { url: "https://x", ok: false, httpStatus: 404, latencyMs: 100, detail: "HTTP 404" };

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
  assert.ok(b.flags.some((f) => f.label === "Zero pool liquidity"));
});

test("a down site zeroes the build criterion", () => {
  const r = getRecord("robin-world")!;
  const s = buildScreen(r, market(6_900), token(100, null), down, false);
  assert.equal(s.criteria.find((c) => c.key === "build")?.score, 0);
  assert.ok(s.flags.some((f) => f.label === "Website unavailable"));
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
  const a = buildScreen(base, market(50_000), token(500, 0.3), up, false);
  const b = buildScreen(gated, market(50_000), token(500, 0.3), up, false);
  assert.ok((a.total ?? 0) > (b.total ?? 0));
});

test('unknown liquidity and outages never imply empty or drained pools', () => {
 const r=getRecord('kindra')!;
 for (const input of [market(null), null]) {
  const s=buildScreen(r,input,token(500,.3),up,true,{state:'error',fetchedAt:null});
  assert.equal(s.total,null);
  assert.equal(s.criteria.find(c=>c.key==='liquidity')?.score,null);
  assert.ok(!s.flags.some(f=>/Zero pool|No indexed/.test(f.label)));
 }
 const empty=buildScreen(r,null,token(500,.3),up,false,{state:'ok',fetchedAt:new Date().toISOString()});
 assert.equal(empty.criteria.find(c=>c.key==='liquidity')?.score,0);
 assert.ok(empty.flags.some(f=>f.label==='No indexed pool'));
});
test('skipped and blocked checks withhold totals without negative website claims', () => {
 const r=getRecord('kindra')!;
 for(const live of [null, {...up,ok:null,httpStatus:403}, {...up,ok:null,httpStatus:null}]) {
  const s=buildScreen(r,market(50000),token(500,.3),live,true);
  assert.equal(s.total,null); assert.equal(s.criteria[0]?.score,null);
  assert.ok(!s.flags.some(f=>f.label==='Website unavailable'));
 }
});
test('holder count is not a concentration score',()=>{
 const s=buildScreen(getRecord('kindra')!,market(50000),token(500000,null),up,false);
 assert.equal(s.total,null); assert.equal(s.coverage.observed,4);
 assert.equal(s.criteria.find(c=>c.key==='spread')?.score,null);
});
