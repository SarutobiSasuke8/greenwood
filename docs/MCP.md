# v0.3 compatibility notice

Criterion scores are nullable, and coverage reports observed/required inputs. Failed or skipped checks withhold the total. Holder concentration has its own source status. Legacy bands remain only for complete observations. Studio report writes are disabled regardless of GREENWOOD_INGEST_TOKEN; any older submission examples below are historical schema examples, not an enabled endpoint.

# MCP server

`packages/mcp` — stdio transport, reads the chain directly through `@greenwood/core`. Works without the website.

## Build

```bash
pnpm install
pnpm --filter @greenwood/core build
pnpm --filter @greenwood/mcp build
```

## Register

Claude Code:

```bash
claude mcp add greenwood -- node /absolute/path/greenwood/packages/mcp/dist/index.js
```

JSON clients (Claude Desktop, Cursor, Windsurf):

```json
{ "mcpServers": { "greenwood": { "command": "node", "args": ["/absolute/path/greenwood/packages/mcp/dist/index.js"] } } }
```

Optional env: `GREENWOOD_RPC_URL`, `GREENWOOD_BLOCKSCOUT_URL`, `GREENWOOD_DATA_DIR`, `GREENWOOD_INGEST_TOKEN` (legacy; the submit tool stays disabled).

## Tools

| Tool | Purpose |
|---|---|
| `greenwood_list_games` | Live list with screen, band, flags, price, liquidity, holders, site state. `status`, `minScreen`, `fast`. |
| `greenwood_get_game` | Full snapshot for one id. |
| `greenwood_get_economy` | On-chain economy + studio reports + sink/faucet ratio. |
| `greenwood_screen_method` | Weights and rules. |
| `greenwood_ticker_collisions` | Shared and squatted tickers. |
| `greenwood_resolve_contract` | Blockscout name search returning all candidates plus the attested contract. Discovery only. |
| `greenwood_chain_status` | Block, block time, gas, ETH price. |
| `greenwood_submit_economy_report` | Append a studio report. Needs the ingest token. |

Resource: `greenwood://registry`.

## Smoke test

```bash
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}' '{"jsonrpc":"2.0","method":"notifications/initialized"}' '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | node packages/mcp/dist/index.js
```
