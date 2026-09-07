# Release and rollback

## Reproducible verification

Node 22 and the packageManager-pinned pnpm version. Run `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm test:ui`, `pnpm build`, start with `pnpm start`, then `pnpm smoke`. CI repeats these checks. Build-time upstream failures may yield partial observations; tests must not require a provider to be healthy.

Manually verify desktop and 320/375-pixel discovery: filter, profile, save, watchlist, share/copy, official destination. Check keyboard focus, image loading and no horizontal overflow. Test normal, empty, unknown and failed views. Automated smoke checks inspect HTTP contracts, not a full browser accessibility audit.

## Before publishing

Choose the hosting account and domain; set NEXT_PUBLIC_SITE_URL to the real HTTPS origin before building. Do not publish localhost canonicals. Configure provider endpoints as deployment secrets. Never expose credentials through NEXT_PUBLIC variables. Budget for RPC limits and monitor provider failures separately from app availability.

Studio ingestion is deliberately disabled in HTTP, MCP and the shared writer. A legacy GREENWOOD_INGEST_TOKEN cannot enable it. Existing JSON reports are read-only; back up GREENWOOD_DATA_DIR before migration. Corrupt files cause explicit errors and must be investigated, not overwritten. Enabling writes requires scoped credentials, transactional storage, idempotency and an audit trail.

## Rollback

Keep the prior immutable release artifact or deployment available. If smoke or source-state checks fail after publication, restore that prior release through the host. Do not reset the user's working tree or overwrite report history. This sweep introduces no storage migration. Re-run smoke and manually verify domain/canonical links after rollback.

No public deployment or rollback rehearsal has been performed by this local sweep. CI is configured but requires a pushed branch to run remotely.
