# Greenwood

**A game index for Robinhood Chain that ranks the build before it prices the token.**

Robinhood Chain (chain id 4663) went live on 1 July 2026. Within weeks it had a gaming layer, and within weeks that layer was mostly tokens. Robinhood's own ecosystem directory has no games category. The one purpose-built hub that existed before this one advertised 42 games, surfaced ten, and displayed hardcoded prices on six of them, including a drained pool shown as the chain's busiest game.

Greenwood asks one question of every title: **is this a game, or a ticker with art?** It answers from live chain data, with every score carrying its written reason, and it refuses to show a number it cannot verify.

- **Website**: index, per-game screen breakdown, evidence, market and token panels, site liveness.
- **REST API**: the same JSON, with an OpenAPI 3.1 description and a studio economy ingest contract.
- **MCP server**: eight tools and one resource for Claude, Cursor and any MCP client, reading the chain directly.

## The screen

| Criterion | Weight | Source |
|---|---|---|
| Playable build | 30% | Direct HTTP check of the official site plus hand-verified playability |
| Team visibility | 15% | Attested in the registry |
| Liquidity depth | 20% | DexScreener best pool |
| Holder spread | 15% | Blockscout top-ten share, or estimated from holder count and marked as such |
| Ticker clarity | 20% | Registry collision count; capped when no contract is attested |

Bands: **sound** ≥ 65, **watch** 45–64, **avoid** < 45. Pre-launch entries are **unscreened**. Full rules in [`docs/METHOD.md`](docs/METHOD.md) and on `/method`.

## Data rules

1. **Nothing is backfilled.** A failed provider leaves the field null and marks the snapshot `partial`.
2. **Contracts are attested, not matched.** A token address enters the registry only when two independent sources agree. This chain carries six Senkai-named and four Thornveil-named ERC-20s.
3. **Liveness is checked directly**, one request per listing per refresh.
4. **Every score carries its basis** as a sentence next to the number.
5. **Registry edits are dated** and the registry is re-swept every four weeks.

## Workspace index

Every app and package is listed here and in the [documentation index](docs/README.md). Purpose lines for `@greenwood/core` and `@greenwood/mcp` are their `package.json` descriptions. `@greenwood/web` has no `description` and no package README; its purpose line is the layout sentence this file already used. Status is the package `version`, and `private` where set. Run commands are existing scripts. The [documentation index](docs/README.md) records the build steps those scripts expect. Design notes are [design.md](design.md) at the repository root, not a file under `docs/`.

| Path | Package | Purpose | Status | Run |
| --- | --- | --- | --- | --- |
| [apps/web](apps/web/package.json) | `@greenwood/web` | Next.js 15 site + /api/v1 route handlers. | Version 0.2.0, private. | `pnpm dev` |
| [packages/core](packages/core/package.json) | `@greenwood/core` | Registry, chain providers, screen scoring and snapshot assembly for Greenwood, the Robinhood Chain game index. | Version 0.2.0. | `pnpm sweep` |
| [packages/mcp](packages/mcp/package.json) | `@greenwood/mcp` | MCP server for Greenwood: live Robinhood Chain game index, screen scores, token economy and contract resolution for AI agents. | Version 0.2.0. | `pnpm --filter @greenwood/core build && pnpm --filter @greenwood/mcp build && pnpm mcp` |

Studio economy JSON, when present, is stored under `data/economy/`. Matching `*.json` files are gitignored.

## Quick start

Requires Node 22.12+ and pnpm 10.

```bash
pnpm install
cp .env.example .env        # optional; defaults use the public RPC and explorer
pnpm sweep                  # prints what the chain says about every registry entry right now
pnpm dev                    # http://localhost:3210
```

Production:

```bash
pnpm build
pnpm start
```

### MCP

```bash
pnpm --filter @greenwood/core build && pnpm --filter @greenwood/mcp build
claude mcp add greenwood -- node /absolute/path/to/greenwood/packages/mcp/dist/index.js
```

See [`docs/MCP.md`](docs/MCP.md) for other clients and the tool list.

## API

Base path `/api/v1`. Read-only, no key, CORS open. Every JSON response carries `generatedAt`; errors are RFC 7807 problems (`application/problem+json`).

| Method | Path | Returns |
|---|---|---|
| GET | `/games` | Every snapshot, ranked by screen total. `?status=live\|dormant\|pre-launch\|unverified`, `&minScreen=0..100`, `&sort=screen\|liquidity\|holders\|change` |
| GET | `/games/{id}` | One snapshot: record, market, token, liveness, screen with a `basis` per criterion, sources, `partial`. 404 for anything that is not a registry id, including names, tickers and addresses |
| GET | `/games/{id}/economy` | On-chain economy plus stored studio reports and the sink/faucet ratio |
| POST | `/games/{id}/economy` | Disabled. 503 for every caller, with or without a bearer token |
| GET | `/registry` | The attested registry, no live data |
| GET | `/collisions` | Ticker collisions |
| GET | `/chain` | Block, block time, gas, ETH price and provider states |
| GET | `/health` | 200 when the RPC answers, 503 when it does not |
| GET | `/openapi.json` | The OpenAPI 3.1 document |

```bash
curl http://localhost:3210/api/v1/games
curl http://localhost:3210/api/v1/games/kindra
curl http://localhost:3210/api/v1/openapi.json
```

**Ranking.** The default order is the screen total, so the build is ranked before the token is priced. Games with no total (pre-launch, partial or missing observations) sort last. Under the market orders, a missing pool or holder count also sorts last, never as zero. The rule lives in `packages/core/src/rank.ts` and is shared by the API and the MCP list tool.

**Gaps.** A failed provider never becomes a backfilled value. The field is `null`, `sources.<provider>.state` is `error`, `partial` is `true` and the total is withheld.

### OpenAPI

The document is written in [`apps/web/lib/openapi.ts`](apps/web/lib/openapi.ts), served at `/api/v1/openapi.json` and committed as [`docs/openapi.json`](docs/openapi.json). After changing a route or a response shape, update `lib/openapi.ts` and run `pnpm openapi:write`.

CI and `pnpm test` check that:

- the document is valid OpenAPI 3.1;
- every route handler under `apps/web/app/api/v1` has a path and method in the document, and every documented operation has a handler (CORS `OPTIONS` handlers excepted);
- every example validates against its schema;
- every response in the endpoint tests validates against the document, and every documented status code is exercised;
- `docs/openapi.json` matches the source (`pnpm openapi:check`).

See [`docs/API.md`](docs/API.md) for field notes and the read-only economy contract.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `GREENWOOD_RPC_URL` | public Robinhood RPC | Swap for Alchemy/QuickNode in production |
| `GREENWOOD_BLOCKSCOUT_URL` | `https://robinhoodchain.blockscout.com` | Explorer instance |
| `GREENWOOD_DATA_DIR` | `./data` | Where economy reports are stored |
| `GREENWOOD_INGEST_TOKEN` | unset | Legacy setting; cannot enable ingestion in v0.3 |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3210` | Canonical URL, OpenAPI servers |

## Adding a game

Edit `packages/core/src/registry.ts`. Copy an entry, fill `evidence` with dated observations, leave `tokenAddress` null until two sources agree, then run `pnpm sweep` and `pnpm test`. Never resolve a contract by ticker.

## Tests

```bash
pnpm test        # core, MCP server, API endpoints and OpenAPI contract
pnpm test:ui     # market view rules
```

Everything runs on Node's built-in runner with no network. Provider responses come from fixtures in `packages/core/src/testing/`. The DexScreener response and the RPC block number were recorded on 2026-10-14. The Blockscout bodies are synthetic, because the explorer answered the recording request with a Cloudflare challenge. The fetch stub fails closed: any request that does not match a fixture fails the test.

- **Core**: registry integrity, ranking, band thresholds and weights, provider failures, and the non-negotiables. A failed provider leaves a visible gap. Every criterion carries a basis under every provider outcome. A name, ticker or address never resolves to a contract.
- **API** (`apps/web/test/`): every `/api/v1` route handler, run in process against the fixtures and validated against the OpenAPI document. The economy `POST` must refuse a missing, wrong and matching bearer token (a throwaway value generated per run) and write nothing.
- **MCP** (`packages/mcp/src/server.test.ts`): all eight tools and the `greenwood://registry` resource over an in-memory transport.

## Local verify

From the repository root, install dependencies and run the same checks as CI:

```bash
pnpm install
pnpm --filter @greenwood/core build
pnpm typecheck
pnpm check:links
pnpm test
pnpm test:ui
pnpm openapi:check
pnpm build
```

Build the core first on a fresh checkout: the web app and MCP server consume its generated types from `dist/`. CI then starts the built site and runs `pnpm smoke` against it.

## Independence

Greenwood is independent and not affiliated with Robinhood Markets, Inc., Offchain Labs, DexScreener or any listed project. Nothing here is investment advice. MIT licence.

## Improvement sweep

See [the implementation plan](docs/IMPROVEMENT-SWEEP.md), [method v0.3](docs/METHOD.md) and [release checklist](docs/RELEASE.md). Criteria can be null; incomplete totals are withheld. Studio writes are disabled at every boundary. Run `pnpm test`, `pnpm test:ui`, `pnpm build`, then `pnpm smoke` against a running preview.
