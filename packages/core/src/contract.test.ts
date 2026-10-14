/**
 * Pins the AGENTS.md non-negotiables against the recorded fixtures:
 *  1. a failed provider leaves a visible gap, never a backfilled value;
 *  2. a contract is never resolved by name or ticker;
 *  3. every screen criterion carries a basis sentence.
 * The network is stubbed and fails closed: no RPC, Blockscout, DexScreener or website calls.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { snapshotAll, snapshotOne, chainStatus } from "./snapshot.js";
import { getRecord, listRecords } from "./registry.js";
import { searchContracts } from "./providers/blockscout.js";
import { installFixtureNetwork, type FixtureProvider } from "./testing/index.js";
import type { GameSnapshot } from "./types.js";

const KINDRA = getRecord("kindra")!.tokenAddress!;

async function sweep(fail: FixtureProvider[] = []): Promise<{ snaps: GameSnapshot[]; calls: string[] }> {
  const net = installFixtureNetwork({ fail });
  try {
    const snaps = await snapshotAll();
    assert.deepEqual(net.unexpected, [], "no request may leave the fixture network");
    return { snaps, calls: [...net.calls] };
  } finally {
    net.restore();
  }
}

const byId = (snaps: GameSnapshot[], id: string) => snaps.find((s) => s.record.id === id)!;

test("healthy fixtures produce complete, unflagged snapshots for attested tokens", async () => {
  const { snaps } = await sweep();
  const kindra = byId(snaps, "kindra");
  assert.equal(kindra.partial, false);
  assert.equal(kindra.market?.liquidityUsd, 85824.56);
  assert.equal(kindra.token?.holders, 536);
  assert.equal(kindra.token?.top10Share, 0.3);
  assert.equal(kindra.sources.dexscreener.state, "ok");
  assert.equal(kindra.screen.total, 81);
});

test("a failed DexScreener call is a visible gap, not a backfilled price", async () => {
  const healthy = byId((await sweep()).snaps, "kindra");
  assert.ok(healthy.market, "control: healthy run has a market");
  const { snaps } = await sweep(["dexscreener"]);
  for (const s of snaps.filter((x) => x.record.tokenAddress)) {
    assert.equal(s.market, null, `${s.record.id}: no market after a failed provider`);
    assert.equal(s.sources.dexscreener.state, "error");
    assert.match(s.sources.dexscreener.detail ?? "", /500/);
    assert.equal(s.partial, true);
    assert.equal(s.screen.total, null, `${s.record.id}: total withheld`);
    const liquidity = s.screen.criteria.find((c) => c.key === "liquidity")!;
    assert.equal(liquidity.score, null);
    assert.match(liquidity.basis, /provider unavailable/i);
    assert.ok(s.screen.flags.some((f) => f.label === "Partial data"));
    assert.ok(!s.screen.flags.some((f) => /Zero pool|No indexed pool/.test(f.label)), "an outage is not an empty pool");
  }
});

test("a blocked explorer leaves holders and concentration unknown", async () => {
  const { snaps } = await sweep(["blockscout"]);
  const kindra = byId(snaps, "kindra");
  assert.equal(kindra.sources.blockscout.state, "error");
  assert.equal(kindra.token?.holders ?? null, null);
  assert.equal(kindra.token?.top10Share ?? null, null);
  assert.equal(kindra.partial, true);
  assert.equal(kindra.screen.total, null);
  assert.equal(kindra.screen.criteria.find((c) => c.key === "spread")!.score, null);
  // Market data from the independent provider still arrives; it is not withheld or invented.
  assert.equal(kindra.market?.liquidityUsd, 85824.56);
});

test("a failed holders call is recorded per source and withholds the total", async () => {
  const kindra = byId((await sweep(["holders"])).snaps, "kindra");
  assert.equal(kindra.sources.holders?.state, "error");
  assert.equal(kindra.sources.blockscout.state, "ok");
  assert.equal(kindra.token?.top10Share, null);
  assert.equal(kindra.token?.holders, 536);
  assert.equal(kindra.screen.total, null);
});

test("unreachable websites are unknown, not dead", async () => {
  const kindra = byId((await sweep(["liveness"])).snaps, "kindra");
  assert.equal(kindra.liveness?.ok, null);
  assert.equal(kindra.sources.liveness.state, "error");
  assert.equal(kindra.screen.criteria.find((c) => c.key === "build")!.score, null);
  assert.ok(!kindra.screen.flags.some((f) => f.label === "Website unavailable"));
});

test("a failed RPC leaves the block number null and the chain status says so", async () => {
  const net = installFixtureNetwork({ fail: ["rpc"] });
  try {
    const chain = await chainStatus();
    assert.equal(chain.blockNumber, null);
    assert.equal(chain.rpc.state, "error");
    assert.equal(chain.blockscout.state, "ok");
    assert.equal(chain.totalBlocks, 88072189);
    assert.deepEqual(net.unexpected, []);
  } finally {
    net.restore();
  }
  const healthy = installFixtureNetwork();
  try {
    assert.equal((await chainStatus()).blockNumber, 0x53fdffd);
  } finally {
    healthy.restore();
  }
});

test("names and tickers never resolve to a record", async () => {
  for (const key of ["KINDRA", "Kindra", "Kindra by Virtuals", "SENKAI", "Senkai", "ROBIN", "0xE44951407D2ed8E73dce4b7002908732BC0d0bC3"]) {
    assert.equal(getRecord(key), undefined, key);
  }
  const net = installFixtureNetwork();
  try {
    assert.equal(await snapshotOne("KINDRA"), null);
    assert.equal(await snapshotOne("Senkai"), null);
  } finally {
    net.restore();
  }
});

test("a name search returns candidates only and never attests a contract", async () => {
  const net = installFixtureNetwork();
  try {
    const before = getRecord("senkai")!.tokenAddress;
    const candidates = await searchContracts("senkai");
    assert.ok(candidates.length >= 6, "the chain has many Senkai-named contracts");
    assert.ok(candidates.every((c) => /^0x[0-9a-fA-F]{40}$/.test(c.address)));
    assert.equal(before, null);
    assert.equal(getRecord("senkai")!.tokenAddress, null, "search does not write to the registry");

    const snaps = await snapshotAll();
    const senkai = byId(snaps, "senkai");
    assert.equal(senkai.token, null);
    assert.equal(senkai.market, null);
    assert.equal(senkai.sources.dexscreener.state, "skipped");
    assert.equal(senkai.sources.blockscout.state, "skipped");

    // Market lookups only ever ask for attested registry addresses.
    const attested = new Set(listRecords().map((r) => r.tokenAddress?.toLowerCase()).filter(Boolean));
    for (const call of net.calls.filter((u) => u.includes("api.dexscreener.com"))) {
      const asked = new URL(call).pathname.split("/").pop()!.split(",");
      for (const a of asked) assert.ok(attested.has(a.toLowerCase()), `unattested address priced: ${a}`);
    }
    for (const c of candidates) assert.ok(!net.calls.some((u) => u.toLowerCase().includes(`/tokens/${c.address.toLowerCase()}`)), `candidate looked up: ${c.address}`);
    assert.deepEqual(net.unexpected, []);
  } finally {
    net.restore();
  }
});

test("every criterion carries a basis sentence under every provider outcome", async () => {
  const outcomes: FixtureProvider[][] = [[], ["dexscreener"], ["blockscout"], ["holders"], ["liveness"], ["dexscreener", "blockscout", "liveness"]];
  for (const fail of outcomes) {
    const { snaps } = await sweep(fail);
    for (const s of snaps) {
      if (s.record.status === "pre-launch") {
        assert.equal(s.screen.total, null);
        assert.equal(s.screen.band, "unscreened");
        continue;
      }
      assert.deepEqual(s.screen.criteria.map((c) => c.key), ["build", "team", "liquidity", "spread", "ticker"], s.record.id);
      for (const c of s.screen.criteria) {
        assert.equal(typeof c.basis, "string");
        assert.ok(c.basis.trim().length >= 8, `${s.record.id}/${c.key} under [${fail}] has no basis`);
        assert.ok(c.score === null || (c.score >= 0 && c.score <= 100));
      }
      if (s.screen.total !== null) assert.ok(s.screen.criteria.every((c) => c.score !== null), "a total needs every criterion");
      for (const f of s.screen.flags) assert.ok(f.reason.trim().length > 0, `${s.record.id} flag ${f.label} has no reason`);
    }
  }
});
