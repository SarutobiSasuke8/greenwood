import type { Metadata } from "next";
import { WEIGHTS } from "@greenwood/core";

export const metadata: Metadata = { title: "Method", description: "How the Greenwood screen scores a game on Robinhood Chain, and the data rules it refuses to break." };

export default function MethodPage() {
  return (
    <div className="page-wrap section">
      <p className="eyebrow">Method</p>
      <h1 style={{ marginTop: 12, fontSize: "clamp(2rem, 3.5vw + 0.5rem, 3.2rem)", fontWeight: 800 }}>How the screen works</h1>
      <div className="prose" style={{ marginTop: 24 }}>
        <p>
          Greenwood answers one question about every title on Robinhood Chain: <strong>is this a game, or a ticker with art?</strong> On a chain where roughly 93% of accounts have only ever touched memecoins, that question protects a player more than any review score.
        </p>

        <h2>Five criteria</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Criterion</th>
                <th>Weight</th>
                <th>How it is scored</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Playable build</td>
                <td>{WEIGHTS.build * 100}%</td>
                <td>0 if the official site does not serve a page. 100 when a build was verified playable without holding the token. 55 when the site is live but playability is not yet established by hand. 30 when the site is live and nothing playable is behind it. Minus 25 if entry requires the token.</td>
              </tr>
              <tr>
                <td>Team visibility</td>
                <td>{WEIGHTS.team * 100}%</td>
                <td>10 anonymous · 45 pseudonymous handles · 75 named individuals · 95 named company or entity.</td>
              </tr>
              <tr>
                <td>Liquidity depth</td>
                <td>{WEIGHTS.liquidity * 100}%</td>
                <td>Best pool in USD from DexScreener. Under $100 is drained and scores 0. Under $10K scores 20, under $50K 45, under $250K 70, above that 95. No indexed pool scores 0.</td>
              </tr>
              <tr>
                <td>Holder spread</td>
                <td>{WEIGHTS.spread * 100}%</td>
                <td>Top-ten wallet share of supply when Blockscout returns the holders list: 20% or less scores 95, down to 10 above 70%. When only a holder count is available the score is estimated from count and marked as such.</td>
              </tr>
              <tr>
                <td>Ticker clarity</td>
                <td>{WEIGHTS.ticker * 100}%</td>
                <td>95 when the ticker identifies one project. 60 with one collision, 35 with two, 15 with three or more. Capped at 30 when no contract has been attested to the project.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The weighted total lands in one of three bands: <strong>sound</strong> at 65 and above, <strong>watch</strong> from 45 to 64, <strong>avoid</strong> below 45. Pre-launch entries are <strong>unscreened</strong>; a score for nothing would be noise.
        </p>

        <h2 id="rules">Data rules</h2>
        <ol>
          <li>
            <strong>Nothing is backfilled.</strong> When a provider fails, the field is shown as missing and the listing is flagged partial. A price from an earlier refresh is never displayed as current.
          </li>
          <li>
            <strong>Contracts are attested, not matched.</strong> A token address enters the registry only when two independent sources agree, for example the address in the project&apos;s own page source and the same contract resolving on Blockscout under that name. Name and ticker matching is never used, because this chain carries six Senkai-named and four Thornveil-named contracts.
          </li>
          <li>
            <strong>Liveness is checked directly.</strong> One HTTP request per listing per refresh. A domain that does not resolve scores zero on build regardless of anything else.
          </li>
          <li>
            <strong>Every score carries its basis.</strong> The sentence next to each criterion is the reason for the number. If the reason is wrong, the number is wrong, and it can be challenged.
          </li>
          <li>
            <strong>Registry edits are dated.</strong> Evidence entries carry the date they were observed. The registry is re-swept in full every four weeks.
          </li>
        </ol>

        <h2>Sources</h2>
        <ul>
          <li>
            <strong>Robinhood Chain public RPC</strong> for block height and ERC-20 metadata read from the contract itself.
          </li>
          <li>
            <strong>Blockscout</strong> for holder counts, top holders, supply and name search.
          </li>
          <li>
            <strong>DexScreener</strong> for pools, price, liquidity, volume and pool age. The deepest pool per token is used.
          </li>
        </ul>
        <p>Refresh interval is five minutes for market and holder data, one minute for chain status. Both are stated in the footer of every page.</p>
      </div>
    </div>
  );
}
