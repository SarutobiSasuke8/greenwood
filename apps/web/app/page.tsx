import Link from "next/link";
import { GameIndex } from "@/components/GameIndex";
import { getCollisions, getSnapshots, indexStats, sortByScreen } from "@/lib/data";
import { timeAgo } from "@/lib/format";

export const revalidate = 300;

export default async function IndexPage() {
  const snapshots = sortByScreen(await getSnapshots());
  const stats = indexStats(snapshots);
  const collisions = getCollisions();

  return (
    <>
      <section className="page-wrap hero">
        <div>
          <p className="eyebrow">Robinhood Chain · chain id 4663 · updated {timeAgo(stats.fetchedAt)}</p>
          <h1 style={{ marginTop: 14 }}>
            Is it a game, or a <em>ticker with art</em>?
          </h1>
          <p className="lead" style={{ marginTop: 18 }}>
            Every title on this chain ships a token before it ships a build. Greenwood checks the site is up, verifies a playable build, reads liquidity and holders from the chain, and flags tickers shared by unrelated projects. Then it prices the token.
          </p>
        </div>

        <dl className="stat-strip">
          <div>
            <dt>Titles indexed</dt>
            <dd>{stats.indexed}</dd>
          </div>
          <div>
            <dt>Playable now</dt>
            <dd>{stats.playable}</dd>
          </div>
          <div>
            <dt>Sites down</dt>
            <dd>
              {stats.sitesDown}
              <small>of {stats.indexed}</small>
            </dd>
          </div>
          <div>
            <dt>Real markets</dt>
            <dd>
              {stats.withMarket}
              <small>≥ $100 liquidity</small>
            </dd>
          </div>
          <div>
            <dt>Ticker collisions</dt>
            <dd>{collisions.length}</dd>
          </div>
          <div>
            <dt>Median screen</dt>
            <dd>{stats.medianScreen ?? "—"}</dd>
          </div>
        </dl>

        {stats.partial > 0 && (
          <p className="notice">
            <b>Partial refresh.</b> {stats.partial} of {stats.indexed} listings had a provider fail on the last sweep. Their missing fields are shown as missing, not carried over from an earlier value.
          </p>
        )}
      </section>

      <section className="page-wrap section" style={{ paddingTop: 0 }}>
        <GameIndex snapshots={snapshots} />
      </section>

      <section className="page-wrap section" id="why">
        <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          <div className="card">
            <h3>What the screen measures</h3>
            <div className="prose" style={{ fontSize: "0.95rem" }}>
              <p>
                Five criteria, fixed weights, every score with a written basis: playable build, team visibility, liquidity depth, holder spread and ticker clarity. Pre-launch entries are not scored at all.
              </p>
              <p>
                <Link href="/method">Read the method</Link>
              </p>
            </div>
          </div>
          <div className="card">
            <h3>Ticker collisions on this chain</h3>
            <div className="prose" style={{ fontSize: "0.95rem" }}>
              <ul>
                {collisions.slice(0, 4).map((c) => (
                  <li key={c.ticker}>
                    <code>${c.ticker}</code> · {c.projects.length > 1 ? `${c.projects.length} unrelated projects` : "1 project"}
                    {c.contractsOnChain ? `, ${c.contractsOnChain} contracts on chain` : ""}
                  </li>
                ))}
              </ul>
              <p>
                <Link href="/about#collisions">Full table</Link>
              </p>
            </div>
          </div>
          <div className="card">
            <h3>For developers and agents</h3>
            <div className="prose" style={{ fontSize: "0.95rem" }}>
              <p>
                The same data behind this page is a REST API with an OpenAPI description and an MCP server. Studios can report in-game economy figures through a documented ingest contract.
              </p>
              <p>
                <Link href="/developers">API</Link> · <Link href="/mcp">MCP</Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
