import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "API", description: "Greenwood REST API: live Robinhood Chain game index, screen scores, token economy and a studio economy ingest contract. OpenAPI 3.1." };

const base = `${SITE.url}/api/v1`;

export default function DevelopersPage() {
  return (
    <div className="page-wrap section">
      <p className="eyebrow">Developers</p>
      <h1 style={{ marginTop: 12, fontSize: "clamp(2rem, 3.5vw + 0.5rem, 3.2rem)", fontWeight: 800 }}>REST API</h1>
      <div className="prose" style={{ marginTop: 24 }}>
        <p>
          Everything on this site is served from the same JSON. No key is needed to read. Responses carry <code>generatedAt</code> and a per-provider <code>sources</code> block, so a consumer can tell live from missing. CORS is open on <code>/api/v1/*</code>.
        </p>
        <p>
          Machine-readable description: <a href="/api/v1/openapi.json">/api/v1/openapi.json</a> (OpenAPI 3.1). Agents may prefer the <Link href="/mcp">MCP server</Link>, which exposes the same surface as tools.
        </p>

        <h2>Endpoints</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Returns</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>GET</td>
                <td>
                  <code>/api/v1/games</code>
                </td>
                <td>
                  All snapshots. Query: <code>status</code>, <code>minScreen</code>, <code>sort</code> (<code>screen</code>, <code>liquidity</code>, <code>holders</code>, <code>change</code>).
                </td>
              </tr>
              <tr>
                <td>GET</td>
                <td>
                  <code>/api/v1/games/{"{id}"}</code>
                </td>
                <td>One full snapshot: record, evidence, market, token, liveness, screen with per-criterion basis, sources.</td>
              </tr>
              <tr>
                <td>GET</td>
                <td>
                  <code>/api/v1/games/{"{id}"}/economy</code>
                </td>
                <td>On-chain token economy plus studio-reported reports and the sink/faucet ratio.</td>
              </tr>
              <tr>
                <td>POST</td>
                <td>
                  <code>/api/v1/games/{"{id}"}/economy</code>
                </td>
                <td>Append a studio economy report. Bearer token required.</td>
              </tr>
              <tr>
                <td>GET</td>
                <td>
                  <code>/api/v1/registry</code>
                </td>
                <td>The attested registry without live data.</td>
              </tr>
              <tr>
                <td>GET</td>
                <td>
                  <code>/api/v1/collisions</code>
                </td>
                <td>Ticker collisions and contract counts.</td>
              </tr>
              <tr>
                <td>GET</td>
                <td>
                  <code>/api/v1/chain</code>
                </td>
                <td>Block height, block time, gas, ETH price, provider states.</td>
              </tr>
              <tr>
                <td>GET</td>
                <td>
                  <code>/api/v1/health</code>
                </td>
                <td>Service and provider health.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Read a game</h2>
        <pre>
          <code>{`curl ${base}/games/kindra`}</code>
        </pre>
        <pre>
          <code>{`{
  "generatedAt": "2026-09-06T10:12:04.118Z",
  "game": {
    "record": { "id": "kindra", "name": "Kindra", "ticker": "KINDRA", "tokenAddress": "0xE449…0bC3", ... },
    "market": { "priceUsd": 0.0002116, "liquidityUsd": 53105.29, "priceChange24h": -2.56, ... },
    "token":  { "holders": 536, "top10Share": null, "totalSupply": "1000000000000000000000000000", ... },
    "liveness": { "ok": true, "httpStatus": 200, "latencyMs": 412 },
    "screen": { "total": 71, "band": "sound", "criteria": [ { "key": "build", "score": 100, "basis": "Site live and a playable build was verified…" }, ... ], "flags": [...] },
    "sources": { "dexscreener": { "state": "ok" }, "blockscout": { "state": "ok" }, "liveness": { "state": "ok" } },
    "partial": false
  }
}`}</code>
        </pre>

        <h2 id="economy">Economy ingest contract</h2>
        <p>
          On-chain data describes the token. It cannot say whether the game economy behind it removes more than it issues, or whether anyone logs in. Existing reports can be read here. New report ingestion is disabled pending scoped credentials, idempotency and transactional storage. POST returns 503 even if a legacy token is configured.
        </p>
        <pre><code>{`curl ${base}/games/kindra/economy`}</code></pre>
        <p>The schema below describes stored reports. It is not an enabled submission API.</p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>reportedAt</code>
                </td>
                <td>ISO 8601</td>
                <td>End of the period being reported.</td>
              </tr>
              <tr>
                <td>
                  <code>period</code>
                </td>
                <td>
                  <code>day</code> | <code>week</code>
                </td>
                <td>Aggregation window.</td>
              </tr>
              <tr>
                <td>
                  <code>dau</code>, <code>wau</code>, <code>newWallets</code>
                </td>
                <td>integer | null</td>
                <td>Active and new player wallets.</td>
              </tr>
              <tr>
                <td>
                  <code>faucetUnits</code>, <code>sinkUnits</code>
                </td>
                <td>number | null</td>
                <td>Token units issued into and removed from the economy. Their ratio over the last seven reports is exposed as <code>sinkFaucetRatio</code>.</td>
              </tr>
              <tr>
                <td>
                  <code>marketplaceVolumeUnits</code>
                </td>
                <td>number | null</td>
                <td>In-game marketplace volume in token units.</td>
              </tr>
              <tr>
                <td>
                  <code>custom</code>
                </td>
                <td>map of number</td>
                <td>Studio-specific metrics. Keys up to 48 characters.</td>
              </tr>
              <tr>
                <td>
                  <code>source</code>
                </td>
                <td>string</td>
                <td>Where the numbers came from, for the audit trail.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Ingest is disabled until <code>GREENWOOD_INGEST_TOKEN</code> is set on the server. Tokens are issued per studio on request; see <Link href="/about#listing">listing</Link>. Reported figures are shown separately from on-chain figures and are labelled as studio-reported on every surface.
        </p>

        <h2>Caching and limits</h2>
        <p>
          Market and holder data are refreshed every five minutes; chain status every minute. Responses set <code>Cache-Control</code> accordingly. There is no per-key rate limit while the API is small; be reasonable, and cache on your side.
        </p>
      </div>
    </div>
  );
}
