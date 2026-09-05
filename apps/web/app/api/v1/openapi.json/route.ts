import { NextResponse } from "next/server";
import { SITE } from "@/lib/site";

const sourceStatus = {
  type: "object",
  properties: { state: { type: "string", enum: ["ok", "error", "skipped"] }, fetchedAt: { type: ["string", "null"], format: "date-time" }, detail: { type: "string" } },
  required: ["state", "fetchedAt"],
};

const economyReport = {
  type: "object",
  required: ["reportedAt", "period", "source"],
  properties: {
    reportedAt: { type: "string", format: "date-time" },
    period: { type: "string", enum: ["day", "week"] },
    dau: { type: ["integer", "null"] },
    wau: { type: ["integer", "null"] },
    newWallets: { type: ["integer", "null"] },
    faucetUnits: { type: ["number", "null"] },
    sinkUnits: { type: ["number", "null"] },
    marketplaceVolumeUnits: { type: ["number", "null"] },
    custom: { type: "object", additionalProperties: { type: "number" } },
    source: { type: "string" },
  },
};

const doc = {
  openapi: "3.1.0",
  info: {
    title: "Greenwood API",
    version: "0.2.0",
    description: "Live Robinhood Chain game index. Attested registry, live market and holder data, five-part screen with per-criterion basis, ticker collisions, and a studio economy ingest contract. Missing fields are null and flagged partial; nothing is backfilled.",
    license: { name: "MIT" },
  },
  servers: [{ url: `${SITE.url}/api/v1` }],
  paths: {
    "/games": {
      get: {
        summary: "List game snapshots",
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["live", "dormant", "pre-launch", "unverified"] } },
          { name: "minScreen", in: "query", schema: { type: "number", minimum: 0, maximum: 100 } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["screen", "liquidity", "holders", "change"] } },
        ],
        responses: { "200": { description: "Snapshots", content: { "application/json": { schema: { $ref: "#/components/schemas/GamesResponse" } } } } },
      },
    },
    "/games/{id}": {
      get: {
        summary: "One game snapshot",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Snapshot", content: { "application/json": { schema: { type: "object", properties: { generatedAt: { type: "string" }, game: { $ref: "#/components/schemas/GameSnapshot" } } } } } }, "404": { description: "Unknown id" } },
      },
    },
    "/games/{id}/economy": {
      get: {
        summary: "On-chain and studio-reported economy for a game",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Economy" } },
      },
      post: {
        summary: "Append a studio economy report",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/EconomyReport" } } } },
        responses: { "201": { description: "Saved" }, "401": { description: "Bad token" }, "422": { description: "Validation failed" }, "503": { description: "Ingest disabled" } },
      },
    },
    "/registry": { get: { summary: "Attested registry without live data", responses: { "200": { description: "Registry" } } } },
    "/collisions": { get: { summary: "Ticker collisions", responses: { "200": { description: "Collisions" } } } },
    "/chain": { get: { summary: "Chain status", responses: { "200": { description: "Status" } } } },
    "/health": { get: { summary: "Service health", responses: { "200": { description: "ok" }, "503": { description: "degraded" } } } },
  },
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
    schemas: {
      SourceStatus: sourceStatus,
      EconomyReport: economyReport,
      GameSnapshot: {
        type: "object",
        properties: {
          record: { type: "object", description: "Attested registry entry with dated evidence." },
          market: { type: ["object", "null"], description: "DexScreener best pool. Null when no pool is indexed." },
          token: { type: ["object", "null"], description: "Blockscout token data, RPC fallback for metadata." },
          liveness: { type: ["object", "null"] },
          screen: { type: "object", properties: { total: { type: ["integer", "null"] }, band: { type: "string", enum: ["sound", "watch", "avoid", "unscreened"] }, criteria: { type: "array" }, flags: { type: "array" } } },
          sources: { type: "object", properties: { dexscreener: sourceStatus, blockscout: sourceStatus, liveness: sourceStatus } },
          fetchedAt: { type: "string", format: "date-time" },
          partial: { type: "boolean" },
        },
      },
      GamesResponse: {
        type: "object",
        properties: { generatedAt: { type: "string" }, chainId: { type: "integer" }, count: { type: "integer" }, games: { type: "array", items: { $ref: "#/components/schemas/GameSnapshot" } } },
      },
    },
  },
};

export function GET() {
  return NextResponse.json(doc, { headers: { "Cache-Control": "public, s-maxage=3600" } });
}
