// Endpoint tests for /api/v1. The route handlers run in process against the recorded
// provider fixtures; the network stub fails closed, so no RPC, Blockscout, DexScreener or
// website request leaves the test. Every response is validated against the OpenAPI
// document, and the last test checks that every documented response was exercised.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server.js";
import { listRecords, tickerCollisions } from "@greenwood/core";
import { installFixtureNetwork } from "@greenwood/core/testing";
import { createResponseChecker, documentedResponses, loadSpec } from "./spec.mjs";

const BASE = "http://localhost:3210/api/v1";
const spec = loadSpec();
const { check, seen } = createResponseChecker(spec);

let routes;
let net;
let dataDir;
let ingestToken;
const previousEnv = { data: process.env.GREENWOOD_DATA_DIR, token: process.env.GREENWOOD_INGEST_TOKEN };

const ctx = (id) => ({ params: Promise.resolve({ id }) });
const req = (path, init) => new NextRequest(`${BASE}${path}`, init);

before(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "greenwood-api-test-"));
  process.env.GREENWOOD_DATA_DIR = dataDir;
  // Throwaway token generated per run, so the refusal tests cover a "correct" token too.
  ingestToken = `test-only-${randomUUID()}`;
  process.env.GREENWOOD_INGEST_TOKEN = ingestToken;
  net = installFixtureNetwork();
  routes = {
    games: await import("../app/api/v1/games/route.ts"),
    game: await import("../app/api/v1/games/[id]/route.ts"),
    economy: await import("../app/api/v1/games/[id]/economy/route.ts"),
    registry: await import("../app/api/v1/registry/route.ts"),
    collisions: await import("../app/api/v1/collisions/route.ts"),
    chain: await import("../app/api/v1/chain/route.ts"),
    health: await import("../app/api/v1/health/route.ts"),
    openapi: await import("../app/api/v1/openapi.json/route.ts"),
  };
});

after(async () => {
  net.restore();
  if (previousEnv.data === undefined) delete process.env.GREENWOOD_DATA_DIR;
  else process.env.GREENWOOD_DATA_DIR = previousEnv.data;
  if (previousEnv.token === undefined) delete process.env.GREENWOOD_INGEST_TOKEN;
  else process.env.GREENWOOD_INGEST_TOKEN = previousEnv.token;
  await rm(dataDir, { recursive: true, force: true });
  assert.deepEqual(net.unexpected, [], "no request may leave the fixture network");
});

async function withFailures(fail, fn) {
  net.setFailures(fail);
  try {
    return await fn();
  } finally {
    net.setFailures([]);
  }
}

test("GET /games ranks by screen total with unscored games last", async () => {
  const res = await routes.games.GET(req("/games"));
  assert.match(res.headers.get("cache-control") ?? "", /s-maxage=300/);
  const body = await check("GET", "/games", res);
  assert.equal(body.chainId, 4663);
  assert.equal(body.count, listRecords().length);
  assert.deepEqual(body.games.slice(0, 4).map((g) => [g.record.id, g.screen.total, g.screen.band]), [
    ["kindra", 81, "sound"],
    ["robinhood-derby", 54, "watch"],
    ["yorozu", 41, "avoid"],
    ["the-floor", 39, "avoid"],
  ]);
  assert.ok(body.games.slice(4).every((g) => g.screen.total === null));
  for (const g of body.games) {
    if (g.record.status !== "pre-launch") assert.equal(g.screen.criteria.length, 5, g.record.id);
    for (const c of g.screen.criteria) assert.ok(c.basis.length > 0, `${g.record.id}/${c.key}`);
  }
});

test("GET /games honours sort, status and minScreen", async () => {
  const byLiquidity = await check("GET", "/games", await routes.games.GET(req("/games?sort=liquidity")));
  assert.deepEqual(byLiquidity.games.slice(0, 3).map((g) => g.record.id), ["kindra", "robinhood-derby", "the-floor"]);
  const live = await check("GET", "/games", await routes.games.GET(req("/games?status=live")));
  assert.ok(live.games.length > 0 && live.games.every((g) => g.record.status === "live"));
  const strong = await check("GET", "/games", await routes.games.GET(req("/games?minScreen=65")));
  assert.deepEqual(strong.games.map((g) => g.record.id), ["kindra"]);
  const unknownSort = await check("GET", "/games", await routes.games.GET(req("/games?sort=price")));
  assert.equal(unknownSort.games[0].record.id, "kindra");
});

test("GET /games shows a failed provider as a gap and never backfills", async () => {
  const body = await withFailures(["dexscreener"], async () => check("GET", "/games", await routes.games.GET(req("/games"))));
  for (const g of body.games.filter((x) => x.record.tokenAddress)) {
    assert.equal(g.market, null, g.record.id);
    assert.equal(g.sources.dexscreener.state, "error");
    assert.equal(g.partial, true);
    assert.equal(g.screen.total, null);
    assert.ok(g.screen.flags.some((f) => f.label === "Partial data"));
  }
  assert.ok(body.games.every((g) => g.screen.total === null || !g.partial));
});

test("GET /games/{id} returns one snapshot and refuses names, tickers and addresses", async () => {
  const body = await check("GET", "/games/{id}", await routes.game.GET(req("/games/kindra"), ctx("kindra")));
  assert.equal(body.game.record.id, "kindra");
  assert.equal(body.game.market.liquidityUsd, 85824.56);
  for (const id of ["no-such-game", "KINDRA", "Kindra", "0xE44951407D2ed8E73dce4b7002908732BC0d0bC3", "SENKAI"]) {
    const res = await routes.game.GET(req(`/games/${id}`), ctx(id));
    assert.equal(res.status, 404, id);
    const problem = await check("GET", "/games/{id}", res);
    assert.equal(problem.title, "Unknown game");
  }
});

test("GET /games/{id}/economy combines on-chain data and stored reports", async () => {
  await mkdir(join(dataDir, "economy"), { recursive: true });
  const reports = [
    { gameId: "kindra", reportedAt: "2026-09-05T00:00:00Z", period: "day", dau: 400, wau: null, newWallets: 20, faucetUnits: 1000, sinkUnits: 1500, marketplaceVolumeUnits: null, source: "fixture" },
    { gameId: "kindra", reportedAt: "2026-09-06T00:00:00Z", period: "day", dau: 412, wau: 1930, newWallets: 27, faucetUnits: 1000, sinkUnits: 500, marketplaceVolumeUnits: 96000, custom: { bossKills: 811 }, source: "fixture" },
  ];
  await writeFile(join(dataDir, "economy", "kindra.json"), JSON.stringify(reports));
  try {
    const body = await check("GET", "/games/{id}/economy", await routes.economy.GET(req("/games/kindra/economy"), ctx("kindra")));
    assert.equal(body.game.tokenAddress, listRecords().find((r) => r.id === "kindra").tokenAddress);
    assert.equal(body.onchain.market.liquidityUsd, 85824.56);
    assert.equal(body.reported.count, 2);
    assert.equal(body.reported.sinkFaucetRatio, 1);
    assert.equal(body.reported.latest.dau, 412);

    const empty = await check("GET", "/games/{id}/economy", await routes.economy.GET(req("/games/senkai/economy"), ctx("senkai")));
    assert.equal(empty.game.tokenAddress, null);
    assert.equal(empty.onchain.market, null);
    assert.equal(empty.reported.count, 0);

    const unknown = await routes.economy.GET(req("/games/KINDRA/economy"), ctx("KINDRA"));
    assert.equal(unknown.status, 404);
    await check("GET", "/games/{id}/economy", unknown);
  } finally {
    await rm(join(dataDir, "economy"), { recursive: true, force: true });
  }
});

test("POST /games/{id}/economy refuses missing, wrong and matching bearer tokens and writes nothing", async () => {
  const body = JSON.stringify({ reportedAt: "2026-09-06T00:00:00Z", period: "day", source: "fixture" });
  const attempts = [
    ["no Authorization header", {}],
    ["wrong token", { authorization: "Bearer wrong-token" }],
    ["malformed scheme", { authorization: ingestToken }],
    ["the configured throwaway token", { authorization: `Bearer ${ingestToken}` }],
  ];
  for (const [label, headers] of attempts) {
    const res = await routes.economy.POST(req("/games/kindra/economy", { method: "POST", headers: { "content-type": "application/json", ...headers }, body }), ctx("kindra"));
    assert.equal(res.status, 503, label);
    assert.equal(res.headers.get("cache-control"), "no-store", label);
    const problem = await check("POST", "/games/{id}/economy", res);
    assert.equal(problem.title, "Ingest disabled", label);
  }
  assert.deepEqual(await readdir(dataDir), [], "no report file may be written");
});

test("OPTIONS /games/{id}/economy answers the CORS preflight", async () => {
  const res = routes.economy.OPTIONS();
  assert.equal(res.status, 204);
});

test("GET /registry and /collisions return the static tables", async () => {
  const registry = await check("GET", "/registry", routes.registry.GET());
  assert.equal(registry.count, listRecords().length);
  assert.deepEqual(registry.registry.map((r) => r.id), listRecords().map((r) => r.id));
  assert.ok(registry.registry.filter((r) => r.tokenAddress).every((r) => r.evidence.length > 0), "attested contracts carry evidence");
  const collisions = await check("GET", "/collisions", routes.collisions.GET());
  assert.deepEqual(collisions.collisions, JSON.parse(JSON.stringify(tickerCollisions())));
});

test("GET /chain reports the recorded block and per-provider state", async () => {
  const body = await check("GET", "/chain", await routes.chain.GET());
  assert.equal(body.chainId, 4663);
  assert.equal(body.blockNumber, 0x53fdffd);
  assert.equal(body.rpc.state, "ok");
  const failed = await withFailures(["rpc"], async () => check("GET", "/chain", await routes.chain.GET()));
  assert.equal(failed.blockNumber, null);
  assert.equal(failed.rpc.state, "error");
});

test("GET /health is 200 when the RPC answers and 503 when it does not", async () => {
  const ok = await routes.health.GET();
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("cache-control"), "no-store");
  const body = await check("GET", "/health", ok);
  assert.equal(body.status, "ok");
  assert.equal(body.ingestEnabled, false, "a configured token does not enable ingest");
  const degraded = await withFailures(["rpc"], () => routes.health.GET());
  assert.equal(degraded.status, 503);
  const down = await check("GET", "/health", degraded);
  assert.equal(down.status, "degraded");
  assert.equal(down.providers.rpc.state, "error");
});

test("GET /openapi.json serves the document", async () => {
  const body = await check("GET", "/openapi.json", routes.openapi.GET());
  assert.equal(body.openapi, "3.1.0");
  assert.deepEqual(Object.keys(body.paths).sort(), Object.keys(spec.paths).sort());
});

test("every documented response was exercised by these tests", () => {
  assert.deepEqual(documentedResponses(spec).filter((r) => !seen.has(r)), []);
});

test("no request left the fixture network", () => {
  assert.deepEqual(net.unexpected, []);
  assert.ok(net.calls.some((u) => u.includes("api.dexscreener.com")), "the fixtures were actually used");
});
