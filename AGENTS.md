# AGENTS.md — Greenwood

Read this before touching the repo.

## What this is

A live game index for Robinhood Chain (4663). Three surfaces over one core: Next.js site with `/api/v1` routes (`apps/web`), a stdio MCP server (`packages/mcp`), and the shared library (`packages/core`) that owns the registry, providers, screen and snapshot assembly.

## Non-negotiables

1. **Never backfill.** If a provider fails, the field is `null`, the snapshot is `partial: true`, and the UI shows a gap. No fallbacks to cached, hardcoded or registry values for live fields.
2. **Never resolve a contract by name or ticker.** `searchContracts` is discovery only. `tokenAddress` in the registry requires two independent sources and a dated evidence entry.
3. **Every screen criterion returns a `basis` sentence.** If you change scoring, change the basis and `docs/METHOD.md` and `/method` in the same commit.
4. **No paid placement, no affiliate links, no trade execution.** The trader panel is deliberately unwired until a venue confirms Robinhood Chain support.
5. **British English** in copy. No em dashes.

## Working in the repo

- `pnpm install`, then `pnpm --filter @greenwood/core build` before running the web app or MCP (both consume `dist/`).
- `pnpm sweep` is the fastest way to see what the chain says. Use it after any registry edit.
- `pnpm test` runs the core tests. Add a test when you add a scoring rule.
- Web app port is 3210. Preview config lives in `.claude/launch.json`.
- Blockscout on this chain sits behind Cloudflare and rejects default fetch user agents. `packages/core/src/http.ts` sets one. Do not remove it.
- The Blockscout holders endpoint is flaky (intermittent 500). `top10Share` is best effort and the spread criterion marks itself `estimated` when it falls back to holder count.

## Where things live

| Concern | File |
|---|---|
| Attested registry | `packages/core/src/registry.ts` |
| Scoring | `packages/core/src/screen.ts` |
| Provider calls | `packages/core/src/providers/*.ts` |
| Snapshot assembly + chain status | `packages/core/src/snapshot.ts` |
| Economy ingest schema + store | `packages/core/src/economy.ts` |
| MCP tools | `packages/mcp/src/index.ts` |
| Caching for the site | `apps/web/lib/data.ts` |
| Design tokens | `apps/web/app/globals.css` |
| Header / footer | `apps/web/components/SiteHeader.tsx`, `SiteFooter.tsx` |
| OpenAPI (source; `docs/openapi.json` is generated) | `apps/web/lib/openapi.ts` |
| Ranking (index, API, MCP) | `packages/core/src/rank.ts` |
| Test fixtures and fail-closed network stub | `packages/core/src/testing/` |

## Registry hygiene

Each entry needs: `id` (kebab), real `website` or null, `tokenAddress` only when attested, `evidence[]` with `YYYY-MM-DD` dates, `verdict` in plain English, `lastVerified`. Set `status` from evidence: `live` (site up), `dormant` (site gone), `pre-launch` (nothing shipped), `unverified` (not yet checked). Re-sweep everything every four weeks and update `lastVerified`.

## Vault link

The main Obsidian vault holds the research trail: `Crypto/Research/Robinhood Chain Game Discovery Landscape.md` and `Crypto/CRM/Games/Robinhood Chain/`. Registry evidence should agree with those notes; if they diverge, the dated evidence with the later date wins and the other is updated.
