# Greenwood design system

Visual sweep, 2026-09-07. Existing Next.js routes and core/API/MCP ownership are preserved.

## Intent
Independent degen game discovery on Robinhood Chain. Atmospheric forest palette, expressive existing Bricolage Grotesque headings, readable Source Sans 3 body and IBM Plex Mono market figures. No hosted gameplay or trade execution.

## Structure
Homepage: illustrated brand introduction, registry counts, filterable Ecosystem Index, short field-guide statement. Detail: editorial record, external game CTA, watchlist, evidence and market observations. Content/API pages retain document layouts. Shared conventional wordmark navigation and compact inline footer.

## Tokens
Root tokens.css owns the forest/ivory/lime palette and shared spacing. globals.css imports it. Semantic market gain/loss colours remain distinct. No motion library; focus, press and save feedback only, with reduced-motion support. New card layouts use minmax(0,1fr).

## Media
public/images/greenwood-forest.png is generated Greenwood brand atmosphere, not game footage. Source generated 2026-09-07 with built-in imagegen; original exec-4b88f505-8341-4371-ab04-f8a4ac9aea0b.png retained in Codex generated_images. Game monograms are typographic placeholders, not invented game logos. Replace them with licensed official art only after recording provenance.

## Presentation boundaries
No numeric investment-style ranking in catalogue cards. Core scoring is unchanged and explicitly experimental in details. marketView suppresses missing, failed, expired, nonpositive/invalid and sub-$100-pool headline quotes; it is not a safety assessment or change to the API. Frontend quote age is based on provider fetchedAt, not underlying trade time. Foreground catalogue polls once per minute, with manual refresh; detail markets expire and ask for reload. Watchlist is local-only, versioned browser storage, with an explicit storage-error state.

## Verification
Build, meaningful presentation-guard tests, existing core tests and browser checks are required before handoff. Full core source-state/scoring and durable ingest fixes remain separate review backlog.

## Official game identity (2026-09-07)
Kindra, Yorozu and The Floor now use unchanged PNG marks from their project websites. The shared registry records asset source URLs, observation dates and additional app/guide destinations. Attribution is available on detail pages and in public/images/games/README.md. Other entries keep accessible monograms until an official asset is confirmed. Cards expose recorded website/community/guide links; detail pages add app and token-reference destinations. Dormant websites are labelled last known. No invented channels, ticker-based logo matching or asset availability claims are added.

## Improvement sweep

Homepage adds a sourced Kindra starting point and genre/entry/platform filters. Watchlist has its own route. Details lead with evidence coverage, player facts, source states and share/contract-copy controls. Screen v0.3 withholds incomplete totals; see docs/METHOD.md. Entry facts are sourced project claims, distinct from manual playtests.
