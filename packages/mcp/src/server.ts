/**
 * Greenwood MCP server definition. `index.ts` connects it to stdio; tests connect it in memory.
 *
 * Gives an agent the same view of Robinhood Chain gaming that the website has:
 * attested registry, live market and holder data, the five-part screen, ticker
 * collisions, studio-reported economy data, and a contract resolver that returns
 * candidates with a warning instead of guessing.
 *
 * Read-only against the chain. The one write, economy ingest, is disabled for every
 * caller, whatever GREENWOOD_INGEST_TOKEN holds, and mirrors the HTTP API exactly.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  appendEconomyReport,
  chainStatus,
  getRecord,
  listEconomyReports,
  listRecords,
  rankGames,
  searchContracts,
  sinkFaucetRatio,
  snapshotAll,
  snapshotOne,
  tickerCollisions,
  WEIGHTS,
} from "@greenwood/core";

const text = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });

export const TOOL_NAMES = [
  "greenwood_list_games",
  "greenwood_get_game",
  "greenwood_screen_method",
  "greenwood_ticker_collisions",
  "greenwood_resolve_contract",
  "greenwood_chain_status",
  "greenwood_get_economy",
  "greenwood_submit_economy_report",
] as const;

export const REGISTRY_RESOURCE_URI = "greenwood://registry";

export function createGreenwoodServer(): McpServer {
  const server = new McpServer({ name: "greenwood", version: "0.2.0" });

  server.registerTool(
    "greenwood_list_games",
    {
      title: "List games on Robinhood Chain",
      description:
        "Every game in the attested Greenwood registry with its live screen score, band, flags, price, liquidity and holder count. Fields are null when a provider failed; `partial` says so. Never treats a missing price as unchanged.",
      inputSchema: {
        status: z.enum(["live", "dormant", "pre-launch", "unverified"]).optional().describe("Filter by listing status."),
        minScreen: z.number().min(0).max(100).optional().describe("Only return games at or above this screen score."),
        fast: z.boolean().optional().describe("Skip the site liveness check and top-holder call for a faster answer."),
      },
    },
    async ({ status, minScreen, fast }) => {
      const snaps = await snapshotAll({ skipLiveness: Boolean(fast), skipHolders: Boolean(fast) });
      const rows = rankGames(snaps, { status, minScreen })
        .map((s) => ({
          id: s.record.id,
          name: s.record.name,
          ticker: s.record.ticker,
          status: s.record.status,
          screen: s.screen.total,
          coverage: s.screen.coverage,
          sources: s.sources,
          band: s.screen.band,
          flags: s.screen.flags.map((f) => f.label),
          priceUsd: s.market?.priceUsd ?? null,
          liquidityUsd: s.market?.liquidityUsd ?? null,
          holders: s.token?.holders ?? null,
          siteUp: s.liveness?.ok ?? null,
          partial: s.partial,
          fetchedAt: s.fetchedAt,
        }));
      return text({ chain: "Robinhood Chain (4663)", count: rows.length, games: rows });
    },
  );

  server.registerTool(
    "greenwood_get_game",
    {
      title: "Get one game in full",
      description: "Full snapshot for one game: attested record with dated evidence, live market data, token data, site liveness, the five screen criteria with their basis, flags, and per-provider source status.",
      inputSchema: { id: z.string().describe("Registry id, e.g. `kindra`.") },
    },
    async ({ id }) => {
      const snap = await snapshotOne(id);
      if (!snap) return { isError: true, content: [{ type: "text", text: `No game with id "${id}". Known ids: ${listRecords().map((r) => r.id).join(", ")}` }] };
      return text(snap);
    },
  );

  server.registerTool(
    "greenwood_screen_method",
    {
      title: "Explain the screen",
      description: "Weights and the scoring rules for the five criteria. Use before interpreting a score.",
      inputSchema: {},
    },
    async () =>
      text({
        weights: WEIGHTS,
        bands: { sound: ">= 65", watch: "45-64", avoid: "< 45", unscreened: "pre-launch, unknown criteria, failed or skipped applicable checks" },
        criteria: {
          build: "Unknown if the probe fails, is blocked or skipped; 0 for HTTP 404/410 or no site; 100 playable without the token; 55 site live but playability unestablished; 30 site live with nothing playable; -25 if entry is token-gated.",
          team: "10 anonymous, 45 pseudonymous, 75 named individuals, 95 named entity.",
          liquidity: "By best-pool USD: <100 => 0 (below quote threshold), <10K => 20, <50K => 45, <250K => 70, else 95. Successful empty lookup => 0; missing liquidity or provider failure => null.",
          spread: "Top-ten share when available (<=20% => 95 down to >70% => 10); otherwise null; holder count is not a concentration measure.",
          ticker: "95 unique, 60 one collision, 35 two, 15 three or more; capped at 30 when no attested contract exists.",
        },
        coverage: "Observed/required criteria; any unknown or partial input withholds the total. Never renormalise weights.",
        rule: "No field is ever backfilled from a stale value. Missing is shown as missing and the snapshot is marked partial.",
      }),
  );

  server.registerTool(
    "greenwood_ticker_collisions",
    {
      title: "Ticker collisions on the chain",
      description: "Which tickers are shared by unrelated projects or squatted by multiple contracts. Check this before quoting any price by symbol.",
      inputSchema: {},
    },
    async () => text(tickerCollisions()),
  );

  server.registerTool(
    "greenwood_resolve_contract",
    {
      title: "Resolve a contract by name (discovery only)",
      description:
        "Searches Blockscout for token contracts carrying a name and returns every candidate. Also returns the attested contract from the registry if one exists. The candidates are NOT attestation; on this chain a name search returns six Senkais.",
      inputSchema: { query: z.string().min(2).describe("Project or token name to search for.") },
    },
    async ({ query }) => {
      const attested = listRecords().filter((r) => r.name.toLowerCase().includes(query.toLowerCase()) || r.ticker?.toLowerCase() === query.toLowerCase());
      let candidates: Awaited<ReturnType<typeof searchContracts>> = [];
      let error: string | null = null;
      try {
        candidates = await searchContracts(query);
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }
      return text({
        warning: "Candidates are name matches from the explorer, not project attestation. Do not price or trade on a candidate.",
        attested: attested.map((r) => ({ id: r.id, name: r.name, ticker: r.ticker, tokenAddress: r.tokenAddress, unattestedContracts: r.unattestedContracts })),
        candidates,
        explorerError: error,
      });
    },
  );

  server.registerTool(
    "greenwood_chain_status",
    {
      title: "Robinhood Chain status",
      description: "Current block, average block time, address and block totals, gas prices and ETH price, with per-provider status.",
      inputSchema: {},
    },
    async () => text(await chainStatus()),
  );

  server.registerTool(
    "greenwood_get_economy",
    {
      title: "Game economy data",
      description: "On-chain token economy for a game (price, liquidity, volume, holders, supply, pair age) plus any studio-reported in-game economy reports (DAU, faucets, sinks, marketplace volume) and the sink/faucet ratio.",
      inputSchema: { id: z.string().describe("Registry id.") },
    },
    async ({ id }) => {
      const record = getRecord(id);
      if (!record) return { isError: true, content: [{ type: "text", text: `No game with id "${id}".` }] };
      const [snap, reports] = await Promise.all([snapshotOne(id, { skipLiveness: true }), listEconomyReports(id)]);
      return text({
        game: { id: record.id, name: record.name, ticker: record.ticker, tokenAddress: record.tokenAddress },
        onchain: { market: snap?.market ?? null, token: snap?.token ?? null, sources: snap?.sources ?? null },
        reported: { count: reports.length, latest: reports.at(-1) ?? null, sinkFaucetRatio: sinkFaucetRatio(reports), reports: reports.slice(-30) },
      });
    },
  );

  server.registerTool(
    "greenwood_submit_economy_report",
    {
      title: "Submit a studio economy report",
      description: "Currently disabled pending scoped credentials and transactional storage. Existing reports remain readable.",
      inputSchema: {
        id: z.string(),
        token: z.string().describe("Ingest bearer token."),
        report: z.object({
          reportedAt: z.string(),
          period: z.enum(["day", "week"]),
          dau: z.number().int().nullable().optional(),
          wau: z.number().int().nullable().optional(),
          newWallets: z.number().int().nullable().optional(),
          faucetUnits: z.number().nullable().optional(),
          sinkUnits: z.number().nullable().optional(),
          marketplaceVolumeUnits: z.number().nullable().optional(),
          custom: z.record(z.string(), z.number()).optional(),
          source: z.string(),
        }),
      },
    },
    async ({ id, token, report }) => {
      return { isError: true, content: [{ type: "text", text: "Studio ingestion is disabled pending scoped credentials and transactional storage." }] };
    },
  );

  server.registerResource(
    "registry",
    REGISTRY_RESOURCE_URI,
    { title: "Attested registry", description: "The hand-verified game registry with evidence, without live data.", mimeType: "application/json" },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(listRecords(), null, 2) }] }),
  );

  return server;
}
