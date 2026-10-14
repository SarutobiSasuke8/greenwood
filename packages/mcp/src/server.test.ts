/**
 * MCP server tests over an in-memory transport, with the recorded provider fixtures and a
 * network stub that fails closed. No RPC, Blockscout, DexScreener or website calls.
 *
 * The tools do not declare `outputSchema`, so their JSON text payloads are parsed against
 * the zod shapes below, which follow the core types. The declared input schemas are
 * checked through the protocol: tools/list exposes them and bad input is refused.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { z } from "zod";
import { listRecords, WEIGHTS } from "@greenwood/core";
import { installFixtureNetwork, type FixtureNetwork } from "@greenwood/core/testing";
import { createGreenwoodServer, REGISTRY_RESOURCE_URI, TOOL_NAMES } from "./server.js";

const sourceStatus = z.object({ state: z.enum(["ok", "error", "skipped"]), fetchedAt: z.string().nullable(), detail: z.string().optional() });
const criterion = z.object({
  key: z.enum(["build", "team", "liquidity", "spread", "ticker"]),
  label: z.string(),
  score: z.number().int().min(0).max(100).nullable(),
  weight: z.number(),
  basis: z.string().min(1),
  estimated: z.boolean(),
});
const listRow = z.object({
  id: z.string(),
  name: z.string(),
  ticker: z.string().nullable(),
  status: z.enum(["live", "dormant", "pre-launch", "unverified"]),
  screen: z.number().int().nullable(),
  coverage: z.object({ observed: z.number().int(), required: z.number().int() }),
  sources: z.object({ dexscreener: sourceStatus, blockscout: sourceStatus, liveness: sourceStatus, holders: sourceStatus.optional() }),
  band: z.enum(["sound", "watch", "avoid", "unscreened"]),
  flags: z.array(z.string()),
  priceUsd: z.number().nullable(),
  liquidityUsd: z.number().nullable(),
  holders: z.number().int().nullable(),
  siteUp: z.boolean().nullable(),
  partial: z.boolean(),
  fetchedAt: z.string(),
});
const listGames = z.object({ chain: z.literal("Robinhood Chain (4663)"), count: z.number().int(), games: z.array(listRow) });
const snapshot = z.object({
  record: z.object({ id: z.string(), tokenAddress: z.string().nullable() }).passthrough(),
  market: z.object({ priceUsd: z.number().nullable(), liquidityUsd: z.number().nullable() }).passthrough().nullable(),
  token: z.object({ holders: z.number().nullable(), top10Share: z.number().nullable() }).passthrough().nullable(),
  liveness: z.object({ ok: z.boolean().nullable() }).passthrough().nullable(),
  screen: z.object({ total: z.number().int().nullable(), band: z.string(), criteria: z.array(criterion), flags: z.array(z.object({ label: z.string(), severity: z.string(), reason: z.string().min(1) })) }),
  sources: z.object({ dexscreener: sourceStatus, blockscout: sourceStatus, liveness: sourceStatus, holders: sourceStatus.optional() }),
  fetchedAt: z.string(),
  partial: z.boolean(),
});
const resolveResult = z.object({
  warning: z.string().min(1),
  attested: z.array(z.object({ id: z.string(), name: z.string(), ticker: z.string().nullable(), tokenAddress: z.string().nullable(), unattestedContracts: z.array(z.string()) })),
  candidates: z.array(z.object({ address: z.string(), name: z.string().nullable(), symbol: z.string().nullable(), tokenType: z.string().nullable(), verified: z.boolean() })),
  explorerError: z.string().nullable(),
});

let client: Client;
let net: FixtureNetwork;
let dataDir: string;
const previousEnv = { data: process.env.GREENWOOD_DATA_DIR, token: process.env.GREENWOOD_INGEST_TOKEN };

type ToolResult = { isError?: boolean; content: { type: string; text?: string }[] };
async function call(name: string, args: Record<string, unknown> = {}): Promise<ToolResult> {
  return (await client.callTool({ name, arguments: args })) as ToolResult;
}
async function callJson(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const res = await call(name, args);
  assert.notEqual(res.isError, true, `${name} returned an error: ${res.content[0]?.text}`);
  return JSON.parse(res.content[0]!.text!);
}

before(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "greenwood-mcp-test-"));
  process.env.GREENWOOD_DATA_DIR = dataDir;
  // Throwaway value generated per run; never a real credential.
  process.env.GREENWOOD_INGEST_TOKEN = `test-only-${crypto.randomUUID()}`;
  net = installFixtureNetwork();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createGreenwoodServer().connect(serverTransport);
  client = new Client({ name: "greenwood-test", version: "0.0.0" });
  await client.connect(clientTransport);
});

after(async () => {
  await client?.close();
  net.restore();
  if (previousEnv.data === undefined) delete process.env.GREENWOOD_DATA_DIR;
  else process.env.GREENWOOD_DATA_DIR = previousEnv.data;
  if (previousEnv.token === undefined) delete process.env.GREENWOOD_INGEST_TOKEN;
  else process.env.GREENWOOD_INGEST_TOKEN = previousEnv.token;
  await rm(dataDir, { recursive: true, force: true });
  assert.deepEqual(net.unexpected, [], "no request may leave the fixture network");
});

test("exposes exactly the eight documented tools, each with an object input schema", async () => {
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), [...TOOL_NAMES].sort());
  for (const t of tools) {
    assert.equal(t.inputSchema.type, "object", t.name);
    assert.ok((t.description ?? "").length > 20, `${t.name} needs a description`);
  }
  const resolve = tools.find((t) => t.name === "greenwood_resolve_contract")!;
  assert.match(resolve.description ?? "", /not attestation/i);
});

test("greenwood://registry resource returns the attested registry", async () => {
  const { resources } = await client.listResources();
  assert.deepEqual(resources.map((r) => r.uri), [REGISTRY_RESOURCE_URI]);
  const { contents } = await client.readResource({ uri: REGISTRY_RESOURCE_URI });
  assert.equal(contents[0]?.mimeType, "application/json");
  assert.deepEqual(JSON.parse(String(contents[0] && "text" in contents[0] ? contents[0].text : "")), JSON.parse(JSON.stringify(listRecords())));
});

test("list_games ranks by screen with unscored games last", async () => {
  const out = listGames.parse(await callJson("greenwood_list_games"));
  assert.equal(out.count, listRecords().length);
  assert.deepEqual(out.games.slice(0, 4).map((g) => [g.id, g.screen]), [["kindra", 81], ["robinhood-derby", 54], ["yorozu", 41], ["the-floor", 39]]);
  assert.ok(out.games.slice(4).every((g) => g.screen === null));
  for (const g of out.games) if (g.partial || g.coverage.observed < g.coverage.required) assert.equal(g.screen, null, g.id);
});

test("list_games filters by status and minScreen", async () => {
  const live = listGames.parse(await callJson("greenwood_list_games", { status: "live" }));
  assert.ok(live.games.every((g) => g.status === "live"));
  const strong = listGames.parse(await callJson("greenwood_list_games", { minScreen: 65 }));
  assert.deepEqual(strong.games.map((g) => g.id), ["kindra"]);
});

test("list_games fast mode skips checks and withholds totals instead of guessing", async () => {
  const out = listGames.parse(await callJson("greenwood_list_games", { fast: true }));
  const kindra = out.games.find((g) => g.id === "kindra")!;
  assert.equal(kindra.sources.liveness.state, "skipped");
  assert.equal(kindra.partial, true);
  assert.equal(kindra.screen, null);
});

test("input schemas are enforced", async () => {
  let refused = false;
  try {
    const res = await call("greenwood_list_games", { minScreen: 500 });
    refused = res.isError === true;
  } catch {
    refused = true;
  }
  assert.ok(refused, "minScreen above 100 must be refused");
});

test("get_game returns a full snapshot with a basis for every criterion", async () => {
  const s = snapshot.parse(await callJson("greenwood_get_game", { id: "kindra" }));
  assert.equal(s.screen.total, 81);
  assert.deepEqual(s.screen.criteria.map((c) => c.key), ["build", "team", "liquidity", "spread", "ticker"]);
  assert.ok(s.screen.criteria.every((c) => c.basis.length > 0));
});

test("get_game shows a failed provider as a gap, not a backfilled value", async () => {
  net.setFailures(["dexscreener"]);
  try {
    const s = snapshot.parse(await callJson("greenwood_get_game", { id: "kindra" }));
    assert.equal(s.market, null);
    assert.equal(s.sources.dexscreener.state, "error");
    assert.equal(s.partial, true);
    assert.equal(s.screen.total, null);
    assert.equal(s.screen.criteria.find((c) => c.key === "liquidity")!.score, null);
  } finally {
    net.setFailures([]);
  }
});

test("get_game does not resolve names, tickers or addresses", async () => {
  for (const id of ["KINDRA", "Kindra", "Kindra by Virtuals", "0xE44951407D2ed8E73dce4b7002908732BC0d0bC3"]) {
    const res = await call("greenwood_get_game", { id });
    assert.equal(res.isError, true, id);
    assert.match(res.content[0]!.text!, /No game with id/);
  }
});

test("resolve_contract returns candidates with a warning and never picks one", async () => {
  const out = resolveResult.parse(await callJson("greenwood_resolve_contract", { query: "senkai" }));
  assert.match(out.warning, /not project attestation/i);
  assert.equal(out.explorerError, null);
  assert.ok(out.candidates.length >= 6);
  const senkai = out.attested.find((a) => a.id === "senkai")!;
  assert.equal(senkai.tokenAddress, null, "a name search must not attest a contract");
  assert.deepEqual(Object.keys(out).sort(), ["attested", "candidates", "explorerError", "warning"]);
});

test("resolve_contract reports an explorer failure instead of inventing candidates", async () => {
  net.setFailures(["blockscout"]);
  try {
    const out = resolveResult.parse(await callJson("greenwood_resolve_contract", { query: "senkai" }));
    assert.deepEqual(out.candidates, []);
    assert.match(out.explorerError ?? "", /403/);
  } finally {
    net.setFailures([]);
  }
});

test("screen_method and ticker_collisions describe the rules", async () => {
  const method = (await callJson("greenwood_screen_method")) as { weights: unknown; rule: string };
  assert.deepEqual(method.weights, WEIGHTS);
  assert.match(method.rule, /No field is ever backfilled/);
  const collisions = z.array(z.object({ ticker: z.string(), projects: z.array(z.object({ id: z.string(), name: z.string() })), contractsOnChain: z.number().nullable(), note: z.string() })).parse(await callJson("greenwood_ticker_collisions"));
  assert.equal(collisions.find((c) => c.ticker === "ROBIN")?.projects.length, 3);
});

test("chain_status reads the recorded block number", async () => {
  const chain = (await callJson("greenwood_chain_status")) as { chainId: number; blockNumber: number | null; rpc: { state: string } };
  assert.equal(chain.chainId, 4663);
  assert.equal(chain.blockNumber, 0x53fdffd);
  assert.equal(chain.rpc.state, "ok");
});

test("get_economy combines on-chain data and stored studio reports", async () => {
  await mkdir(join(dataDir, "economy"), { recursive: true });
  const reports = [
    { gameId: "kindra", reportedAt: "2026-09-05T00:00:00Z", period: "day", dau: 400, wau: null, newWallets: 20, faucetUnits: 1000, sinkUnits: 1500, marketplaceVolumeUnits: null, source: "fixture" },
    { gameId: "kindra", reportedAt: "2026-09-06T00:00:00Z", period: "day", dau: 412, wau: 1930, newWallets: 27, faucetUnits: 1000, sinkUnits: 500, marketplaceVolumeUnits: 96000, source: "fixture" },
  ];
  await writeFile(join(dataDir, "economy", "kindra.json"), JSON.stringify(reports));
  try {
    const out = (await callJson("greenwood_get_economy", { id: "kindra" })) as { onchain: { market: { liquidityUsd: number } | null }; reported: { count: number; sinkFaucetRatio: number; latest: { dau: number } } };
    assert.equal(out.onchain.market?.liquidityUsd, 85824.56);
    assert.equal(out.reported.count, 2);
    assert.equal(out.reported.sinkFaucetRatio, 1);
    assert.equal(out.reported.latest.dau, 412);
    const unknown = await call("greenwood_get_economy", { id: "KINDRA" });
    assert.equal(unknown.isError, true);
  } finally {
    await rm(join(dataDir, "economy"), { recursive: true, force: true });
  }
});

test("submit_economy_report is refused for missing, wrong and matching tokens and writes nothing", async () => {
  const report = { reportedAt: "2026-09-06T00:00:00Z", period: "day", source: "fixture" };
  for (const token of ["", "wrong-token", process.env.GREENWOOD_INGEST_TOKEN!]) {
    const res = await call("greenwood_submit_economy_report", { id: "kindra", token, report });
    assert.equal(res.isError, true);
    assert.match(res.content[0]!.text!, /disabled/i);
  }
  assert.deepEqual(await readdir(dataDir), [], "no report file may be written");
});
