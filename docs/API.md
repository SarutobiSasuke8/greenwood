# v0.3 compatibility notice

Criterion scores are nullable, and coverage reports observed/required inputs. Failed or skipped checks withhold the total. Holder concentration has its own source status. Legacy bands remain only for complete observations. Studio report writes are disabled regardless of GREENWOOD_INGEST_TOKEN; any older submission examples below are historical schema examples, not an enabled endpoint.

# REST API

Base: `/api/v1`. No key to read. CORS open. Every response carries `generatedAt`. Problems use RFC 7807 (`application/problem+json`). OpenAPI 3.1 at `/api/v1/openapi.json`.

| Method | Path | Notes |
|---|---|---|
| GET | `/games` | `?status=live|dormant|pre-launch|unverified` `&minScreen=0..100` `&sort=screen|liquidity|holders|change` |
| GET | `/games/{id}` | Full snapshot |
| GET | `/games/{id}/economy` | On-chain + studio-reported economy, `sinkFaucetRatio` over last 7 reports |
| POST | `/games/{id}/economy` | `Authorization: Bearer <GREENWOOD_INGEST_TOKEN>`; body = EconomyReport; 201 on save |
| GET | `/registry` | Attested registry, no live data |
| GET | `/collisions` | Ticker collision table |
| GET | `/chain` | Block, block time, gas, ETH price, provider states |
| GET | `/health` | 200 ok / 503 degraded |

## EconomyReport

```json
{
  "reportedAt": "2026-09-06T00:00:00Z",
  "period": "day",
  "dau": 412, "wau": 1930, "newWallets": 27,
  "faucetUnits": 184000, "sinkUnits": 221500,
  "marketplaceVolumeUnits": 96000,
  "custom": { "bossKills": 811 },
  "source": "kindra-telemetry v3"
}
```

`reportedAt`, `period`, `source` are required. Numeric fields accept null. `custom` keys ≤ 48 chars. Reports are append-only per game, stored under `GREENWOOD_DATA_DIR/economy/{id}.json`, and shown separately from on-chain figures everywhere.

## Snapshot shape

`record` (attested) · `market` (DexScreener best pool or null) · `token` (Blockscout, RPC fallback for metadata) · `liveness` · `screen { total, band, criteria[{key,label,score,weight,basis,estimated}], flags[{label,severity,reason}] }` · `sources { dexscreener, blockscout, liveness }` each `{ state: ok|error|skipped, fetchedAt, detail? }` · `fetchedAt` · `partial`.

## Caching

Market and holders: 300 s. Chain: 60 s. `Cache-Control: public, s-maxage=…, stale-while-revalidate=…` on reads; `no-store` on health and writes.
