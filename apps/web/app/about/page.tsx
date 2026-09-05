import type { Metadata } from "next";
import Link from "next/link";
import { getCollisions } from "@/lib/data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "About", description: "Why Greenwood exists, what it found on Robinhood Chain, ticker collisions, and how to get a game listed." };

export default function AboutPage() {
  const collisions = getCollisions();
  return (
    <div className="page-wrap section">
      <p className="eyebrow">About</p>
      <h1 style={{ marginTop: 12, fontSize: "clamp(2rem, 3.5vw + 0.5rem, 3.2rem)", fontWeight: 800 }}>Why Greenwood exists</h1>
      <div className="prose" style={{ marginTop: 24 }}>
        <p>
          Robinhood Chain went live on 1 July 2026. Within weeks it had a gaming layer, and within weeks that layer was mostly tokens. Robinhood&apos;s own ecosystem directory has no games category. The generalist aggregators list one title. The single purpose-built hub that existed before this one advertised 42 games, surfaced ten, and displayed hardcoded prices on six of them, including a drained pool shown as the chain&apos;s busiest game.
        </p>
        <p>
          On this chain the player and the trader are the same person. The useful question is not &ldquo;is it fun&rdquo; but &ldquo;is this a game, or a ticker with art&rdquo;. Greenwood answers that first, from live chain data, with every score carrying its reason. <Link href="/method">The method is public.</Link>
        </p>

        <h2>What the first sweep found</h2>
        <ul>
          <li>Of nine titles carried over from the incumbent, five had websites that did not serve a page.</li>
          <li>One title, Kindra, had both a playable build and a functioning market.</li>
          <li>One title had a live product site over a pool holding zero liquidity.</li>
          <li>Three unrelated projects trade as ROBIN. Six contracts carry the Senkai name. Four carry Thornveil, for a game that has not launched.</li>
        </ul>

        <h2 id="collisions">Ticker collisions</h2>
        <p>Recorded because it is the single most reusable finding on this chain, and the reason Greenwood never resolves a contract by symbol.</p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Registry projects</th>
                <th>Contracts on chain</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {collisions.map((c) => (
                <tr key={c.ticker}>
                  <td>
                    <code>${c.ticker}</code>
                  </td>
                  <td>
                    {c.projects.map((p, i) => (
                      <span key={p.id}>
                        {i > 0 && ", "}
                        <Link href={`/games/${p.id}`}>{p.name}</Link>
                      </span>
                    ))}
                  </td>
                  <td>{c.contractsOnChain ?? "—"}</td>
                  <td>{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="listing">Listing a game</h2>
        <p>
          Greenwood lists games it can verify, not games that ask. To be indexed, send the official site, the token contract address as published on that site, and a contact. The contract is confirmed against the explorer, the site is checked, and the build is played before anything appears. Studios that want to report in-game economy figures receive an ingest token at the same time.
        </p>
        <p>
          Open an issue on <a href={`${SITE.github}/issues/new`}>GitHub</a> or reach out on <a href={SITE.x}>X</a>. There is no paid placement. There will not be.
        </p>

        <h2>Independence</h2>
        <p>
          Greenwood is independent and not affiliated with Robinhood Markets, Inc., Offchain Labs, DexScreener or any listed project. It holds no position in any listed token at the time of writing and will disclose one if that changes. Nothing on this site is investment advice.
        </p>
        <p>
          Source code, registry and method are public at <a href={SITE.github}>{SITE.github.replace("https://", "")}</a>.
        </p>
      </div>
    </div>
  );
}
