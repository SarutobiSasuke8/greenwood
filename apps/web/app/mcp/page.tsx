import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "MCP server", description: "Give Claude, Cursor or any MCP client a live view of Robinhood Chain gaming: games, screen scores, token economy, ticker collisions and a contract resolver." };

const tools = [
  ["greenwood_list_games", "Every game with live screen score, band, flags, price, liquidity, holders and site state. Filters by status and minimum score."],
  ["greenwood_get_game", "One game in full: record with dated evidence, market, token, liveness, criteria with basis, per-provider sources."],
  ["greenwood_get_economy", "On-chain token economy plus studio-reported reports and the sink/faucet ratio."],
  ["greenwood_screen_method", "Weights and scoring rules, for interpreting a score correctly."],
  ["greenwood_ticker_collisions", "Which tickers are shared or squatted. Check before quoting anything by symbol."],
  ["greenwood_resolve_contract", "Blockscout name search returning every candidate, with the attested contract alongside and a warning that candidates are not attestation."],
  ["greenwood_chain_status", "Block height, block time, gas, ETH price, provider states."],
  ["greenwood_submit_economy_report", "Append a studio economy report. Requires the ingest token; disabled by default."],
];

export default function McpPage() {
  return (
    <div className="page-wrap section">
      <p className="eyebrow">MCP server</p>
      <h1 style={{ marginTop: 12, fontSize: "clamp(2rem, 3.5vw + 0.5rem, 3.2rem)", fontWeight: 800 }}>Greenwood for agents</h1>
      <div className="prose" style={{ marginTop: 24 }}>
        <p>
          The MCP server exposes the same registry, live data and screen as the website, as eight tools and one resource, over stdio. It reads the chain directly, so it works without the website running. It is read-only against the chain; studio report ingestion is disabled pending scoped credentials and transactional storage.
        </p>

        <h2>Install</h2>
        <p>Clone and build once:</p>
        <pre>
          <code>{`git clone ${SITE.github}.git
cd greenwood
pnpm install
pnpm --filter @greenwood/core build
pnpm --filter @greenwood/mcp build`}</code>
        </pre>

        <h3>Claude Code</h3>
        <pre>
          <code>{`claude mcp add greenwood -- node /path/to/greenwood/packages/mcp/dist/index.js`}</code>
        </pre>

        <h3>Claude Desktop, Cursor and other JSON-configured clients</h3>
        <pre>
          <code>{`{
  "mcpServers": {
    "greenwood": {
      "command": "node",
      "args": ["/path/to/greenwood/packages/mcp/dist/index.js"],
      "env": {
        "GREENWOOD_RPC_URL": "https://rpc.mainnet.chain.robinhood.com"
      }
    }
  }
}`}</code>
        </pre>

        <h2>Tools</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Tool</th>
                <th>What it returns</th>
              </tr>
            </thead>
            <tbody>
              {tools.map(([name, desc]) => (
                <tr key={name}>
                  <td>
                    <code>{name}</code>
                  </td>
                  <td>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Resource: <code>greenwood://registry</code> returns the attested registry as JSON without live data.
        </p>

        <h2>What an agent should know</h2>
        <ul>
          <li>Fields are null when a provider failed and the snapshot says <code>partial: true</code>. Do not read null as zero or unchanged.</li>
          <li>
            <code>greenwood_resolve_contract</code> is discovery, not attestation. It exists so an agent can see the six Senkais rather than pick one.
          </li>
          <li>Scores come with a written basis per criterion. Quote the basis, not just the number.</li>
          <li>Nothing here is a recommendation to trade.</li>
        </ul>
        <p>
          Prefer HTTP? The <Link href="/developers">REST API</Link> has the same surface with an OpenAPI description.
        </p>
      </div>
    </div>
  );
}
