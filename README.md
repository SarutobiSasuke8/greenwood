# Greenwood

**A game index for Robinhood Chain that ranks the build before it prices the token.**

Robinhood Chain (chain id 4663) went live on 1 July 2026. Within weeks it had a gaming layer, and within weeks that layer was mostly tokens. Robinhood's own ecosystem directory has no games category. The one purpose-built hub that existed before this one advertised 42 games, surfaced ten, and displayed hardcoded prices on six of them, including a drained pool shown as the chain's busiest game.

Greenwood asks one question of every title: **is this a game, or a ticker with art?** It answers from live chain data, with every score carrying its written reason, and it refuses to show a number it cannot verify.

- **Website** — index, per-game screen breakdown, evidence, market and token panels, site liveness.
- **REST API** — the same JSON, with an OpenAPI 3.1 description and a studio economy ingest contract.
- **MCP server** — eight tools and one resource for Claude, Cursor and any MCP client, reading the chain directly.

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

## Layout

```
apps/web            Next.js 15 site + /api/v1 route handlers
packages/core       registry, chain providers (viem RPC, Blockscout, DexScreener, liveness), screen, snapshot, economy store
packages/mcp        stdio MCP server over @greenwood/core
docs/               API, MCP, method, design notes
data/economy/       studio-reported economy reports (JSON, gitignored)
```

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

### API

```bash
curl http://localhost:3210/api/v1/games/kindra
curl http://localhost:3210/api/v1/openapi.json
```

See [`docs/API.md`](docs/API.md), including the read-only economy contract.

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
pnpm test
```

Node's built-in runner over the compiled core. Covers registry integrity, band ordering, dead-site zeroing, pre-launch exclusion, partial flagging, ticker collisions and token-gate penalties.

## Local verify

From the repository root, install dependencies and run all 3 existing checks:

```bash
pnpm install
pnpm --filter @greenwood/core build
pnpm typecheck
pnpm test
pnpm build
```

Build the core first on a fresh checkout: the web app and MCP server consume its generated types from `dist/`. The remaining commands check workspace types, run the core tests and build the core, MCP server and website. Run them locally before opening a PR.

## Independence

Greenwood is independent and not affiliated with Robinhood Markets, Inc., Offchain Labs, DexScreener or any listed project. Nothing here is investment advice. MIT licence.

## Improvement sweep

See [the implementation plan](docs/IMPROVEMENT-SWEEP.md), [method v0.3](docs/METHOD.md) and [release checklist](docs/RELEASE.md). Criteria can be null; incomplete totals are withheld. Studio writes are disabled at every boundary. Run `pnpm test`, `pnpm test:ui`, `pnpm build`, then `pnpm smoke` against a running preview.
