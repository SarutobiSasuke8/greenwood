# Changelog

## Unreleased

### Added
- API and MCP test suite on recorded provider fixtures behind a fail-closed fetch stub (`@greenwood/core/testing`). Endpoint tests for every `/api/v1` handler, MCP tests for all eight tools and the registry resource over an in-memory transport, ranking unit tests, and tests that pin the non-negotiables: failed providers leave gaps, every criterion carries a basis, names and tickers never resolve a contract.
- OpenAPI 3.1 document moved to `apps/web/lib/openapi.ts` with full response schemas, committed as `docs/openapi.json`. CI checks validity, route parity both ways, examples, response validation and drift (`pnpm openapi:check`).
- `rankGames` in core, shared by `/api/v1/games` and the MCP list tool.

### Changed
- `/api/v1/health` reports `ingestEnabled: false` always; ingest is disabled whatever `GREENWOOD_INGEST_TOKEN` holds.
- Chain status reads the block number without viem's in-process reuse, so a failed RPC shows as failed.
- MCP server definition split into `server.ts`; `index.ts` stays the stdio entry and `bin`.

## 0.2.0 — 2026-09-06

First repo build. Replaces the 2026-09-05 static prototype, which carried placeholder figures.

### Added
- `@greenwood/core`: attested registry of nine Robinhood Chain titles with dated evidence; providers for the public RPC (viem), Blockscout v2 (browser UA required) and DexScreener; direct site liveness check; five-criterion screen with per-criterion basis; snapshot assembly that records per-provider status and never backfills; ticker collision table; file-backed studio economy store with a zod contract; `pnpm sweep` CLI; seven tests.
- `@greenwood/web`: Next.js 15 site on port 3210. Index with live stat strip, filter/sort/search, band-striped rows; per-game page with screen breakdown, verdict, evidence, unattested contracts, market/token/site panels with source badges, reported-economy panel and a deliberately unwired trader panel; Method, API, MCP and About pages; sticky blurred header with live chain pulse and mobile panel; footer with directory, live data-source states, Ask-AI row and independence line; robots, sitemap, icon.
- `/api/v1`: `games`, `games/{id}`, `games/{id}/economy` (GET + bearer-gated POST), `registry`, `collisions`, `chain`, `health`, `openapi.json`. CORS open on reads. RFC 7807 problem responses.
- `@greenwood/mcp`: stdio server with eight tools (`list_games`, `get_game`, `get_economy`, `screen_method`, `ticker_collisions`, `resolve_contract`, `chain_status`, `submit_economy_report`) and the `greenwood://registry` resource.

### Verified against the live chain on 2026-09-06
- Block 55,496,873 from the public RPC.
- Kindra: 0.0002116 USD, 53.1K USD liquidity, 536 holders, site up, screen 71 (sound).
- Five of nine official sites confirmed down by the liveness checker.
- The Floor: pool liquidity 0, screen 39, flagged "Pool drained".
