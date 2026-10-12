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
          Greenwood is an independent, deliberately small directory of Robinhood Chain games. We help you find official destinations, inspect dated build evidence and understand the limits of available token data.
        </p>
        <p>
          Some visitors want to play; others want to investigate a token. Greenwood keeps those questions separate. Automated checks show reachability and market observations; only a dated human check establishes playability. <Link href="/method">The method is public.</Link>
        </p>

        <h2>Historical observations: 6 September 2026</h2>
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
          Send the official website, gameplay description, supported devices, entry requirements, social links and artwork source. If a token exists, include the address as published by the project and an independent explorer reference. Unverified and pre-launch listings are labelled as such; listing is not endorsement. Studio-report ingestion is currently disabled.
        </p>
        <p>
          Open an issue on <a href={`${SITE.github}/issues/new`}>GitHub</a> or reach out on <a href={SITE.x}>X</a>. There is no paid placement. There will not be.
        </p>

        <h2>Independence</h2>
        <p>
          Greenwood is independent and not affiliated with Robinhood Markets, Inc., Offchain Labs, DexScreener or any listed project. Listing order is not sold. Nothing on this site is investment advice.
        </p>
        <p>
          Source code, registry and method are public at <a href={SITE.github}>{SITE.github.replace("https://", "")}</a>.
        </p>
      </div>
    </div>
  );
}
