# Greenwood evidence method v0.3

Discovery, build evidence and token observations are separate. A live website is not a playtest. A score is not a safety verdict, investment recommendation or measure of fun.

## Criteria

| Criterion | Weight | Observed-data rule |
| --- | --- | --- |
| Build | 30% | 100 for a manually checked playable build with a successful website probe; 55 if gameplay is unestablished; 30 if no playable build was found; subtract 25 for recorded token-gated entry. A confirmed HTTP 404/410 scores 0. A blocked, timed-out, failed or skipped probe is unknown. No website on record scores 0. |
| Team visibility | 15% | Legacy descriptive scale: 10 unrecorded identity, 45 pseudonymous handles, 75 named individuals, 95 named entity. This is documentation coverage, not integrity or fraud risk. |
| Liquidity | 20% | Best observed pool USD: below 100 scores 0; below 10K 20; below 50K 45; below 250K 70; otherwise 95. An explicitly successful empty lookup scores 0. Missing fields and provider failures are unknown. Zero liquidity is an observation; it does not prove a rug or exit. |
| Holder concentration | 15% | Top-ten share: <=20% 95; <=35% 75; <=50% 50; <=70% 25; otherwise 10. Unknown concentration has no score. Holder count is never a substitute for distribution. Addresses may include pools, bridges or custody contracts, not ten individual people. |
| Ticker clarity | 20% | Legacy scale: 95 for zero recorded collisions, 60 for one, 35 for two, 15 for three or more; capped at 30 without an attested contract. This does not prove global uniqueness. |

## Coverage and compatibility

Each criterion supplies a nullable score and a written basis. Coverage reports observed/required criteria. A total is withheld if any criterion is unknown or an applicable provider/check failed or was skipped. Do not renormalise remaining weights. Pre-launch entries have no total. Legacy API bands (sound >=65, watch >=45, avoid <45) remain for compatible complete records only; they are not safety judgements. The UI leads with coverage and evidence, not these bands. MCP fast-mode results cannot be compared as lower scores: they are incomplete.

## Provider rules

Provider deadlines include JSON response bodies; bodies are bounded to 5 MB. Website probes examine headers and cancel the body. HTTP 403/429/5xx and network failures mean check unavailable, not game abandonment. HTTP 404/410 describes the requested website endpoint only.

DexScreener data must match Robinhood Chain and a requested attested base-token address. Invalid numbers become null; malformed or wrong-chain responses fail rather than implying no pool. The deepest observed pool is selected. Raw observations remain in the API; the UI hides headline quotes for invalid, expired, failed, unattested and below-$100-liquidity observations. A ten-minute expiry measures provider retrieval age, not last trade time.

Holder subrequests have separate source states. Failed metadata, failed concentration and skipped work remain visible. Manual playability and project entry requirements carry their own dates and source links. Never infer token identity from a ticker.

Studio reports are read-only. Ingestion is disabled at HTTP and shared-core boundaries pending scoped credentials, transactional persistence and idempotency. Missing files mean no reports; corrupt or unreadable files are errors, never empty history.
