/**
 * The Greenwood OpenAPI 3.1 document. Served at `/api/v1/openapi.json` and committed as
 * `docs/openapi.json`. CI checks that the two agree, that the document is valid OpenAPI
 * 3.1, that every route handler under `app/api/v1` has a path here and the reverse, that
 * every example validates against its schema, and that responses from the endpoint
 * tests validate against these schemas. Change a route and this file in the same commit,
 * then run `pnpm openapi:write`.
 *
 * Deliberately import-free so the generator script can load it without the Next runtime.
 */

const nullable = (type: string, extra: Record<string, unknown> = {}) => ({ type: [type, "null"], ...extra });
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const jsonContent = (schema: unknown, example?: unknown) => ({ "application/json": example === undefined ? { schema } : { schema, example } });
const problem = (description: string) => ({ description, content: { "application/problem+json": { schema: ref("Problem") } } });
const idParam = { name: "id", in: "path", required: true, description: "Registry id, for example `kindra`. Names, tickers and contract addresses are not accepted.", schema: { type: "string" } };
const address = { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" };
const isoDate = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" };

const economyReportExample = {
  reportedAt: "2026-09-06T00:00:00Z",
  period: "day",
  dau: 412,
  wau: 1930,
  newWallets: 27,
  faucetUnits: 184000,
  sinkUnits: 221500,
  marketplaceVolumeUnits: 96000,
  custom: { bossKills: 811 },
  source: "kindra-telemetry v3",
};

const schemas = {
  Problem: {
    type: "object",
    description: "RFC 7807 problem detail.",
    required: ["type", "title", "status"],
    properties: { type: { type: "string" }, title: { type: "string" }, status: { type: "integer" }, detail: { type: "string" } },
  },
  SourceStatus: {
    type: "object",
    required: ["state", "fetchedAt"],
    properties: { state: { type: "string", enum: ["ok", "error", "skipped"] }, fetchedAt: nullable("string", { format: "date-time" }), detail: { type: "string" } },
  },
  Evidence: {
    type: "object",
    required: ["date", "note"],
    properties: { date: isoDate, note: { type: "string", minLength: 1 }, url: { type: "string" } },
  },
  GameRecord: {
    type: "object",
    description: "Attested registry entry with dated evidence. `tokenAddress` is set only when two independent sources agree; it is never matched by name or ticker.",
    required: ["id", "name", "ticker", "genre", "summary", "website", "socials", "tokenAddress", "pairAddress", "status", "playable", "tokenGated", "teamVisibility", "tickerCollisions", "unattestedContracts", "discoveredVia", "evidence", "verdict", "lastVerified"],
    properties: {
      id: { type: "string", pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" },
      name: { type: "string" },
      ticker: nullable("string"),
      genre: { type: "string" },
      summary: { type: "string" },
      website: nullable("string"),
      socials: { type: "object", additionalProperties: { type: "string" } },
      tokenAddress: { oneOf: [address, { type: "null" }] },
      pairAddress: { oneOf: [address, { type: "null" }] },
      status: { type: "string", enum: ["live", "dormant", "pre-launch", "unverified"] },
      playable: nullable("boolean"),
      tokenGated: { type: "boolean" },
      teamVisibility: { type: "integer", enum: [0, 1, 2, 3] },
      tickerCollisions: { type: "integer", minimum: 0 },
      unattestedContracts: { type: "array", items: address, description: "Name matches without attestation. Never used for pricing." },
      discoveredVia: { type: "string" },
      evidence: { type: "array", items: ref("Evidence") },
      verdict: { type: "string" },
      lastVerified: isoDate,
    },
  },
  MarketData: {
    type: "object",
    description: "DexScreener best pool for an attested token.",
    required: ["priceUsd", "priceChange24h", "volume24hUsd", "liquidityUsd", "fdvUsd", "marketCapUsd", "txns24h", "pairAddress", "pairCreatedAt", "dex", "quoteSymbol", "dexscreenerUrl"],
    properties: {
      priceUsd: nullable("number"),
      priceChange24h: nullable("number"),
      volume24hUsd: nullable("number"),
      liquidityUsd: nullable("number"),
      fdvUsd: nullable("number"),
      marketCapUsd: nullable("number"),
      txns24h: { oneOf: [{ type: "object", required: ["buys", "sells"], properties: { buys: { type: "integer" }, sells: { type: "integer" } } }, { type: "null" }] },
      pairAddress: nullable("string"),
      pairCreatedAt: nullable("string", { format: "date-time" }),
      dex: nullable("string"),
      quoteSymbol: nullable("string"),
      dexscreenerUrl: nullable("string"),
    },
  },
  TokenData: {
    type: "object",
    description: "Blockscout token data, with contract metadata read over RPC when the explorer fails.",
    required: ["address", "name", "symbol", "decimals", "totalSupply", "holders", "top10Share", "explorerUrl"],
    properties: {
      address,
      name: nullable("string"),
      symbol: nullable("string"),
      decimals: nullable("integer"),
      totalSupply: nullable("string"),
      holders: nullable("integer", { minimum: 0 }),
      top10Share: nullable("number", { minimum: 0, maximum: 1 }),
      explorerUrl: { type: "string" },
    },
  },
  Liveness: {
    type: "object",
    required: ["url", "ok", "httpStatus", "latencyMs"],
    properties: { url: { type: "string" }, ok: nullable("boolean"), httpStatus: nullable("integer"), latencyMs: nullable("number"), detail: { type: "string" } },
  },
  ScreenCriterion: {
    type: "object",
    description: "One screen criterion. The score is null when unknown; the basis sentence is always present.",
    required: ["key", "label", "score", "weight", "basis", "estimated"],
    properties: {
      key: { type: "string", enum: ["build", "team", "liquidity", "spread", "ticker"] },
      label: { type: "string" },
      score: nullable("integer", { minimum: 0, maximum: 100 }),
      weight: { type: "number", minimum: 0, maximum: 1 },
      basis: { type: "string", minLength: 1 },
      estimated: { type: "boolean" },
    },
  },
  Flag: {
    type: "object",
    required: ["label", "severity", "reason"],
    properties: { label: { type: "string" }, severity: { type: "string", enum: ["good", "caution", "risk"] }, reason: { type: "string", minLength: 1 } },
  },
  Screen: {
    type: "object",
    required: ["total", "band", "coverage", "criteria", "flags"],
    properties: {
      total: nullable("integer", { minimum: 0, maximum: 100, description: "Withheld (null) when any criterion is unknown or the snapshot is partial." }),
      band: { type: "string", enum: ["sound", "watch", "avoid", "unscreened"] },
      coverage: { type: "object", required: ["observed", "required"], properties: { observed: { type: "integer", minimum: 0 }, required: { type: "integer", minimum: 0 } } },
      criteria: { type: "array", items: ref("ScreenCriterion"), description: "Five criteria, or none for pre-launch entries." },
      flags: { type: "array", items: ref("Flag") },
    },
  },
  Sources: {
    type: "object",
    description: "Per-provider outcome for the snapshot.",
    required: ["dexscreener", "blockscout", "liveness"],
    properties: { dexscreener: ref("SourceStatus"), blockscout: ref("SourceStatus"), liveness: ref("SourceStatus"), holders: ref("SourceStatus") },
  },
  GameSnapshot: {
    type: "object",
    description: "What the chain says right now. A failed provider leaves its field null, records the failure in `sources` and sets `partial`; nothing is backfilled.",
    required: ["record", "market", "token", "liveness", "screen", "sources", "fetchedAt", "partial"],
    properties: {
      record: ref("GameRecord"),
      market: { oneOf: [ref("MarketData"), { type: "null" }] },
      token: { oneOf: [ref("TokenData"), { type: "null" }] },
      liveness: { oneOf: [ref("Liveness"), { type: "null" }] },
      screen: ref("Screen"),
      sources: ref("Sources"),
      fetchedAt: { type: "string", format: "date-time" },
      partial: { type: "boolean" },
    },
  },
  GamesResponse: {
    type: "object",
    required: ["generatedAt", "chainId", "count", "games"],
    properties: { generatedAt: { type: "string", format: "date-time" }, chainId: { type: "integer", const: 4663 }, count: { type: "integer", minimum: 0 }, games: { type: "array", items: ref("GameSnapshot") } },
  },
  GameResponse: {
    type: "object",
    required: ["generatedAt", "game"],
    properties: { generatedAt: { type: "string", format: "date-time" }, game: ref("GameSnapshot") },
  },
  EconomyReport: {
    type: "object",
    required: ["reportedAt", "period", "source"],
    properties: {
      reportedAt: { type: "string", format: "date-time" },
      period: { type: "string", enum: ["day", "week"] },
      dau: nullable("integer", { minimum: 0 }),
      wau: nullable("integer", { minimum: 0 }),
      newWallets: nullable("integer", { minimum: 0 }),
      faucetUnits: nullable("number", { minimum: 0 }),
      sinkUnits: nullable("number", { minimum: 0 }),
      marketplaceVolumeUnits: nullable("number", { minimum: 0 }),
      custom: { type: "object", propertyNames: { maxLength: 48 }, additionalProperties: { type: "number" } },
      source: { type: "string", minLength: 1, maxLength: 200 },
    },
    examples: [economyReportExample],
  },
  StoredEconomyReport: {
    allOf: [ref("EconomyReport"), { type: "object", required: ["gameId"], properties: { gameId: { type: "string" } } }],
  },
  EconomyResponse: {
    type: "object",
    required: ["generatedAt", "game", "onchain", "reported"],
    properties: {
      generatedAt: { type: "string", format: "date-time" },
      game: {
        type: "object",
        required: ["id", "name", "ticker", "tokenAddress"],
        properties: { id: { type: "string" }, name: { type: "string" }, ticker: nullable("string"), tokenAddress: { oneOf: [address, { type: "null" }] } },
      },
      onchain: {
        type: "object",
        required: ["market", "token", "sources", "fetchedAt"],
        properties: {
          market: { oneOf: [ref("MarketData"), { type: "null" }] },
          token: { oneOf: [ref("TokenData"), { type: "null" }] },
          sources: { oneOf: [ref("Sources"), { type: "null" }] },
          fetchedAt: nullable("string", { format: "date-time" }),
        },
      },
      reported: {
        type: "object",
        required: ["count", "latest", "sinkFaucetRatio", "reports"],
        properties: {
          count: { type: "integer", minimum: 0 },
          latest: { oneOf: [ref("StoredEconomyReport"), { type: "null" }] },
          sinkFaucetRatio: nullable("number"),
          reports: { type: "array", items: ref("StoredEconomyReport") },
        },
      },
    },
  },
  RegistryResponse: {
    type: "object",
    required: ["generatedAt", "count", "registry"],
    properties: { generatedAt: { type: "string", format: "date-time" }, count: { type: "integer", minimum: 0 }, registry: { type: "array", items: ref("GameRecord") } },
  },
  TickerCollision: {
    type: "object",
    required: ["ticker", "projects", "contractsOnChain", "note"],
    properties: {
      ticker: { type: "string" },
      projects: { type: "array", items: { type: "object", required: ["id", "name"], properties: { id: { type: "string" }, name: { type: "string" } } } },
      contractsOnChain: nullable("integer", { minimum: 0 }),
      note: { type: "string" },
    },
  },
  CollisionsResponse: {
    type: "object",
    required: ["generatedAt", "collisions"],
    properties: { generatedAt: { type: "string", format: "date-time" }, collisions: { type: "array", items: ref("TickerCollision") } },
  },
  ChainStatus: {
    type: "object",
    required: ["generatedAt", "chainId", "name", "blockNumber", "averageBlockTimeMs", "totalAddresses", "totalBlocks", "gasPriceGwei", "ethPriceUsd", "rpc", "blockscout", "fetchedAt"],
    properties: {
      generatedAt: { type: "string", format: "date-time" },
      chainId: { type: "integer", const: 4663 },
      name: { type: "string" },
      blockNumber: nullable("integer"),
      averageBlockTimeMs: nullable("number"),
      totalAddresses: nullable("integer"),
      totalBlocks: nullable("integer"),
      gasPriceGwei: { oneOf: [{ type: "object", required: ["slow", "average", "fast"], properties: { slow: { type: "number" }, average: { type: "number" }, fast: { type: "number" } } }, { type: "null" }] },
      ethPriceUsd: nullable("number"),
      rpc: ref("SourceStatus"),
      blockscout: ref("SourceStatus"),
      fetchedAt: { type: "string", format: "date-time" },
    },
  },
  Health: {
    type: "object",
    required: ["generatedAt", "status", "providers", "ingestEnabled", "version"],
    properties: {
      generatedAt: { type: "string", format: "date-time" },
      status: { type: "string", enum: ["ok", "degraded"] },
      providers: { type: "object", required: ["rpc", "blockscout"], properties: { rpc: ref("SourceStatus"), blockscout: ref("SourceStatus") } },
      ingestEnabled: { type: "boolean", const: false, description: "Studio report writes are disabled in this version." },
      version: { type: "string" },
    },
  },
};

export function buildOpenApi(serverUrl: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Greenwood API",
      version: "0.3.0",
      description:
        "Live Robinhood Chain game index. Attested registry, live market and holder data, five-part screen with a basis sentence per criterion, ticker collisions, and a read-only studio economy contract. Missing fields are null and flagged partial; nothing is backfilled. Contracts are never resolved by name or ticker.",
      license: { name: "MIT" },
    },
    servers: [{ url: `${serverUrl.replace(/\/$/, "")}/api/v1` }],
    paths: {
      "/games": {
        get: {
          operationId: "listGames",
          summary: "List game snapshots, ranked by screen total by default",
          parameters: [
            { name: "status", in: "query", schema: { type: "string", enum: ["live", "dormant", "pre-launch", "unverified"] } },
            { name: "minScreen", in: "query", description: "Keep games scored at or above this. Unscored games never pass.", schema: { type: "number", minimum: 0, maximum: 100 } },
            { name: "sort", in: "query", description: "Unknown values fall back to `screen`. Missing observations sort last.", schema: { type: "string", enum: ["screen", "liquidity", "holders", "change"], default: "screen" } },
          ],
          responses: { "200": { description: "Snapshots", content: jsonContent(ref("GamesResponse")) } },
        },
      },
      "/games/{id}": {
        get: {
          operationId: "getGame",
          summary: "One game snapshot",
          parameters: [idParam],
          responses: { "200": { description: "Snapshot", content: jsonContent(ref("GameResponse")) }, "404": problem("Unknown id") },
        },
      },
      "/games/{id}/economy": {
        get: {
          operationId: "getGameEconomy",
          summary: "On-chain and studio-reported economy for a game",
          parameters: [idParam],
          responses: { "200": { description: "Economy", content: jsonContent(ref("EconomyResponse")) }, "404": problem("Unknown id") },
        },
        post: {
          operationId: "submitEconomyReport",
          summary: "Disabled: studio report ingestion",
          description: "Refused for every caller, with or without a bearer token, pending scoped credentials and transactional storage.",
          security: [{ bearerAuth: [] }],
          parameters: [idParam],
          requestBody: { required: true, content: jsonContent(ref("EconomyReport"), economyReportExample) },
          responses: { "503": problem("Ingest disabled pending scoped credentials and transactional storage") },
        },
      },
      "/registry": {
        get: { operationId: "getRegistry", summary: "Attested registry without live data", responses: { "200": { description: "Registry", content: jsonContent(ref("RegistryResponse")) } } },
      },
      "/collisions": {
        get: { operationId: "getCollisions", summary: "Ticker collisions", responses: { "200": { description: "Collisions", content: jsonContent(ref("CollisionsResponse")) } } },
      },
      "/chain": {
        get: { operationId: "getChain", summary: "Chain status", responses: { "200": { description: "Status", content: jsonContent(ref("ChainStatus")) } } },
      },
      "/health": {
        get: {
          operationId: "getHealth",
          summary: "Service health",
          responses: { "200": { description: "ok", content: jsonContent(ref("Health")) }, "503": { description: "degraded", content: jsonContent(ref("Health")) } },
        },
      },
      "/openapi.json": {
        get: { operationId: "getOpenApi", summary: "This document", responses: { "200": { description: "OpenAPI 3.1 document", content: jsonContent({ type: "object", required: ["openapi", "info", "paths"] }) } } },
      },
    },
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
      schemas,
    },
  };
}
