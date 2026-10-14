# Documentation index

Index of every app under `apps/` and every package under `packages/`.

Purpose lines for `@greenwood/core` and `@greenwood/mcp` are the `description` field in that package's `package.json`. `@greenwood/web` has no `description` and no package README, so its purpose line is the layout sentence already used in the repository README. Status is the `version` in `package.json`, plus `private` where that field is set. Run commands are scripts that already exist. This page does not add commands.

`pnpm check:links` (`node scripts/check-links.mjs`) checks relative links in Markdown, checks that this index names every app and package, and checks that indexed pnpm commands are real scripts.

## Apps

| Path | Package | Purpose | Status | Run |
| --- | --- | --- | --- | --- |
| [apps/web](../apps/web/package.json) | `@greenwood/web` | Next.js 15 site + /api/v1 route handlers. | Version 0.2.0, private. | `pnpm dev` |

`pnpm dev` is the root script. It builds `@greenwood/core`, then runs the web `dev` script, which is `next dev -p 3210`. After `pnpm build`, `pnpm start` serves that app with `next start -p 3210`.

## Packages

| Path | Package | Purpose | Status | Run |
| --- | --- | --- | --- | --- |
| [packages/core](../packages/core/package.json) | `@greenwood/core` | Registry, chain providers, screen scoring and snapshot assembly for Greenwood, the Robinhood Chain game index. | Version 0.2.0. | `pnpm sweep` |
| [packages/mcp](../packages/mcp/package.json) | `@greenwood/mcp` | MCP server for Greenwood: live Robinhood Chain game index, screen scores, token economy and contract resolution for AI agents. | Version 0.2.0. | `pnpm --filter @greenwood/core build && pnpm --filter @greenwood/mcp build && pnpm mcp` |

`pnpm sweep` is the root script. It runs the core `sweep` script, which compiles the package and then runs `node dist/cli/sweep.js`. Core has no server start script.

`pnpm mcp` is the root script. It runs the MCP `start` script, which is `node dist/index.js`. Build first with `pnpm --filter @greenwood/core build` and `pnpm --filter @greenwood/mcp build`, because `start` reads `dist/`.

## Other documents

Design notes are [design.md](../design.md) at the repository root. They are not a file under `docs/`. The other documents in this directory:

| Document | What it is |
| --- | --- |
| [API](API.md) | REST API, including the read-only economy contract. |
| [MCP](MCP.md) | MCP server build, clients and tools. |
| [Method](METHOD.md) | Evidence method v0.3. |
| [Release checklist](RELEASE.md) | Verification, publishing and rollback notes. |
| [Improvement sweep](IMPROVEMENT-SWEEP.md) | 2026-09-07 implementation plan. |
| [Project README](../README.md) | Product overview, quick start and the same workspace index. |

Studio economy JSON, when present, is stored under `data/economy/` and matching `*.json` files are gitignored. That directory is not an app or a package, and it is not linked here because it may be absent.
