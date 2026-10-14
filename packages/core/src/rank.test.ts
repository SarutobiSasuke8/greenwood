import { test } from "node:test";
import assert from "node:assert/strict";
import { rankGames, isRankSort } from "./rank.js";
import { buildScreen, WEIGHTS } from "./screen.js";
import { getRecord, listRecords } from "./registry.js";
import { snapshotAll } from "./snapshot.js";
import { installFixtureNetwork } from "./testing/index.js";
import type { GameRecord, GameSnapshot, Liveness, MarketData, Screen, TokenData } from "./types.js";

const up: Liveness = { url: "https://x", ok: true, httpStatus: 200, latencyMs: 10 };
const ok = { state: "ok" as const, fetchedAt: "2026-10-14T00:00:00.000Z" };

const market = (liquidityUsd: number | null, priceChange24h: number | null = 0): MarketData => ({
  priceUsd: 0.01, priceChange24h, volume24hUsd: 0, liquidityUsd, fdvUsd: null, marketCapUsd: null, txns24h: null,
  pairAddress: "0x0000000000000000000000000000000000000001", pairCreatedAt: null, dex: "uniswap", quoteSymbol: "WETH", dexscreenerUrl: null,
});
const token = (holders: number | null, top10: number | null): TokenData => ({
  address: "0x0000000000000000000000000000000000000002", name: "T", symbol: "T", decimals: 18, totalSupply: "1000", holders, top10Share: top10, explorerUrl: "",
});

function snap(id: string, screen: Partial<Screen> & { total: number | null }, extra: Partial<GameSnapshot> = {}): GameSnapshot {
  const record = { ...getRecord("kindra")!, id, name: id };
  return {
    record,
    market: null,
    token: null,
    liveness: null,
    screen: { band: "unscreened", coverage: { observed: 5, required: 5 }, criteria: [], flags: [], ...screen },
    sources: { dexscreener: ok, blockscout: ok, liveness: ok },
    fetchedAt: ok.fetchedAt,
    partial: false,
    ...extra,
  };
}

test("default ranking orders by screen total, highest first, unknown totals last", () => {
  const ranked = rankGames([snap("a", { total: 40 }), snap("b", { total: null }), snap("c", { total: 81 }), snap("d", { total: 0 })]);
  assert.deepEqual(ranked.map((s) => s.record.id), ["c", "a", "d", "b"]);
});

test("the build is ranked before the token is priced", () => {
  const deepPool = snap("ticker-with-art", { total: 30 }, { market: market(5_000_000) });
  const realGame = snap("real-game", { total: 70 }, { market: market(500) });
  assert.deepEqual(rankGames([deepPool, realGame]).map((s) => s.record.id), ["real-game", "ticker-with-art"]);
  assert.deepEqual(rankGames([realGame, deepPool], { sort: "liquidity" }).map((s) => s.record.id), ["ticker-with-art", "real-game"]);
});

test("ties keep registry order and the input is not mutated", () => {
  const input = [snap("first", { total: 50 }), snap("second", { total: 50 }), snap("third", { total: 50 })];
  const before = input.map((s) => s.record.id);
  assert.deepEqual(rankGames(input).map((s) => s.record.id), before);
  assert.deepEqual(input.map((s) => s.record.id), before);
});

test("market and holder sorts put missing observations last, never at zero", () => {
  const games = [
    snap("no-market", { total: 90 }),
    snap("drained", { total: 10 }, { market: market(0, -100) }),
    snap("deep", { total: 50 }, { market: market(80_000, 4), token: token(900, 0.3) }),
    snap("null-liquidity", { total: 60 }, { market: market(null, null), token: token(null, null) }),
  ];
  assert.deepEqual(rankGames(games, { sort: "liquidity" }).map((s) => s.record.id), ["deep", "drained", "no-market", "null-liquidity"]);
  assert.deepEqual(rankGames(games, { sort: "holders" }).map((s) => s.record.id).slice(0, 1), ["deep"]);
  assert.deepEqual(rankGames(games, { sort: "change" }).map((s) => s.record.id), ["deep", "drained", "no-market", "null-liquidity"]);
});

test("unknown sort keys fall back to the screen order", () => {
  assert.equal(isRankSort("liquidity"), true);
  assert.equal(isRankSort("price"), false);
  const games = [snap("low", { total: 10 }, { market: market(1_000_000) }), snap("high", { total: 90 })];
  assert.deepEqual(rankGames(games, { sort: "price" }).map((s) => s.record.id), ["high", "low"]);
  assert.deepEqual(rankGames(games, { sort: null }).map((s) => s.record.id), ["high", "low"]);
});

test("minScreen and status filters never let an unknown total through", () => {
  const games = [snap("scored", { total: 0 }), snap("unknown", { total: null }), snap("high", { total: 70 })];
  assert.deepEqual(rankGames(games, { minScreen: 0 }).map((s) => s.record.id), ["high", "scored"]);
  assert.deepEqual(rankGames(games, { minScreen: 65 }).map((s) => s.record.id), ["high"]);
  assert.deepEqual(rankGames(games, { minScreen: Number.NaN }), []);
  const dormant = snap("dormant", { total: 99 }, { record: { ...getRecord("senkai")! } });
  assert.deepEqual(rankGames([...games, dormant], { status: "dormant" }).map((s) => s.record.id), ["senkai"]);
});

test("band thresholds sit at 65 and 45", () => {
  const base: GameRecord = { ...getRecord("kindra")!, tokenGated: false };
  const bandFor = (top10: number, liquidity: number, team: GameRecord["teamVisibility"]) =>
    buildScreen({ ...base, teamVisibility: team }, market(liquidity), token(500, top10), up, false, ok);
  const sound = bandFor(0.1, 300_000, 3);
  assert.equal(sound.band, "sound");
  assert.ok((sound.total ?? 0) >= 65);
  for (const s of [bandFor(0.1, 300_000, 3), bandFor(0.6, 5_000, 0), bandFor(0.9, 50, 0)]) {
    const expected = s.total! >= 65 ? "sound" : s.total! >= 45 ? "watch" : "avoid";
    assert.equal(s.band, expected);
  }
});

test("the total is the weighted sum of the five criteria, weights summing to one", () => {
  assert.equal(Object.values(WEIGHTS).reduce((a, b) => a + b, 0).toFixed(10), (1).toFixed(10));
  const s = buildScreen(getRecord("kindra")!, market(85_000), token(536, 0.3), up, false, ok);
  const expected = Math.round(s.criteria.reduce((acc, c) => acc + (c.score ?? 0) * c.weight, 0));
  assert.equal(s.total, expected);
  assert.deepEqual(s.criteria.map((c) => c.key), ["build", "team", "liquidity", "spread", "ticker"]);
});

test("fixture sweep ranks the registry deterministically", async () => {
  const net = installFixtureNetwork();
  try {
    const ranked = rankGames(await snapshotAll());
    const scored = ranked.filter((s) => s.screen.total !== null);
    assert.deepEqual(scored.map((s) => [s.record.id, s.screen.total, s.screen.band]), [
      ["kindra", 81, "sound"],
      ["robinhood-derby", 54, "watch"],
      ["yorozu", 41, "avoid"],
      ["the-floor", 39, "avoid"],
    ]);
    // Everything after the scored block is unscored, in registry order.
    const rest = ranked.slice(scored.length).map((s) => s.record.id);
    assert.deepEqual(rest, listRecords().map((r) => r.id).filter((id) => !scored.some((s) => s.record.id === id)));
    assert.deepEqual(net.unexpected, []);
  } finally {
    net.restore();
  }
});
