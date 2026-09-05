import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listEconomyReports, listRecords, sinkFaucetRatio, explorerAddressUrl } from "@greenwood/core";
import { getSnapshot } from "@/lib/data";
import { bandColor, fmtDate, fmtInt, fmtPct, fmtPrice, fmtShare, fmtSupply, fmtUsdCompact, scoreColor, shortAddr, timeAgo } from "@/lib/format";

export const revalidate = 300;

export function generateStaticParams() {
  return listRecords().map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const snap = await getSnapshot(id);
  if (!snap) return { title: "Not found" };
  return {
    title: `${snap.record.name}${snap.record.ticker ? ` ($${snap.record.ticker})` : ""}`,
    description: `${snap.record.summary} Screen ${snap.screen.total ?? "unscreened"} on Greenwood.`,
  };
}

function Src({ label, state, detail }: { label: string; state: "ok" | "error" | "skipped"; detail?: string }) {
  return (
    <span className="src" data-state={state} title={detail ?? state}>
      <i aria-hidden="true" />
      {label} {state === "ok" ? "" : state}
    </span>
  );
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snap = await getSnapshot(id);
  if (!snap) notFound();
  const { record, market, token, liveness, screen, sources } = snap;
  const band = bandColor(screen.band);
  const reports = await listEconomyReports(id);
  const ratio = sinkFaucetRatio(reports);
  const tradeable = Boolean(market && (market.liquidityUsd ?? 0) >= 100);

  return (
    <div className="page-wrap" style={{ ["--band" as string]: band }}>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Index</Link>
        <span aria-hidden="true">/</span>
        <span>{record.name}</span>
      </nav>

      <header className="detail-head">
        <div>
          <p className="eyebrow">
            {record.genre} · {record.status.replace("-", " ")} · verified {record.lastVerified}
          </p>
          <h1 style={{ marginTop: 10 }}>{record.name}</h1>
          <div className="detail-sub">
            {record.ticker && <span className="tick">${record.ticker}</span>}
            <span className="band-pill">{screen.band}</span>
            {record.website && (
              <a href={record.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                {record.website.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            )}
            {record.socials.x && (
              <a href={record.socials.x} target="_blank" rel="noopener noreferrer">
                X
              </a>
            )}
            {record.socials.telegram && (
              <a href={record.socials.telegram} target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
            )}
            {record.socials.discord && (
              <a href={record.socials.discord} target="_blank" rel="noopener noreferrer">
                Discord
              </a>
            )}
          </div>
          <p className="lead" style={{ marginTop: 16, fontSize: "1.05rem" }}>
            {record.summary}
          </p>
        </div>
        <div className="score-big">
          <p className="eyebrow">Greenwood screen</p>
          <div className="n">{screen.total ?? "—"}</div>
          <p className="eyebrow" style={{ marginTop: 6 }}>
            refreshed {timeAgo(snap.fetchedAt)}
          </p>
        </div>
      </header>

      <div className="detail-grid">
        <div className="detail-col">
          <div className="flags" style={{ gap: 6 }}>
            {screen.flags.map((f) => (
              <span key={f.label} className="flag" data-sev={f.severity} title={f.reason}>
                {f.label}
              </span>
            ))}
          </div>

          <section className="card">
            <h3>Screen breakdown</h3>
            {screen.criteria.length === 0 ? (
              <p className="prose">Pre-launch entries are not scored. There is nothing to screen until something ships.</p>
            ) : (
              <ul className="criteria">
                {screen.criteria.map((c) => (
                  <li key={c.key}>
                    <span className="lbl">
                      {c.label}
                      <small>
                        weight {Math.round(c.weight * 100)}%{c.estimated ? " · estimated" : ""}
                      </small>
                    </span>
                    <span>
                      <span className="bar">
                        <i style={{ width: `${c.score}%`, background: scoreColor(c.score) }} />
                      </span>
                      <span className="basis">{c.basis}</span>
                    </span>
                    <span className="val" style={{ color: scoreColor(c.score) }}>
                      {c.score}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h3>Verdict</h3>
            <p className="prose">{record.verdict}</p>
          </section>

          <section className="card">
            <h3>Evidence</h3>
            <ul className="evidence">
              {record.evidence.map((e, i) => (
                <li key={i}>
                  <time dateTime={e.date}>{e.date}</time>
                  <span>
                    {e.note}{" "}
                    {e.url && (
                      <a href={e.url} target="_blank" rel="noopener noreferrer">
                        source
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <p className="stub">Discovered via {record.discoveredVia}. Evidence is written by hand and dated; nothing above is generated from the live feed.</p>
          </section>

          {record.unattestedContracts.length > 0 && (
            <section className="card">
              <h3>Unattested contracts carrying this name</h3>
              <p className="prose" style={{ fontSize: "0.92rem", marginBottom: 12 }}>
                These exist on chain under the project&apos;s name but nobody has attested that any of them belongs to it. They are never priced here.
              </p>
              <ul className="evidence">
                {record.unattestedContracts.map((a) => (
                  <li key={a} style={{ gridTemplateColumns: "1fr" }}>
                    <a href={explorerAddressUrl(a)} target="_blank" rel="noopener noreferrer" className="mono" style={{ fontSize: "0.8rem" }}>
                      {a}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="detail-col">
          <section className="card">
            <h3>
              Market <Src label="DexScreener" state={sources.dexscreener.state} detail={sources.dexscreener.detail} />
            </h3>
            {market ? (
              <dl className="kv">
                <dt>Price</dt>
                <dd>{fmtPrice(market.priceUsd)}</dd>
                <dt>24h change</dt>
                <dd className={market.priceChange24h === null ? "dim" : market.priceChange24h >= 0 ? "up" : "down"}>{fmtPct(market.priceChange24h)}</dd>
                <dt>Liquidity</dt>
                <dd>{fmtUsdCompact(market.liquidityUsd)}</dd>
                <dt>24h volume</dt>
                <dd>{fmtUsdCompact(market.volume24hUsd)}</dd>
                <dt>24h trades</dt>
                <dd>{market.txns24h ? `${market.txns24h.buys} buys · ${market.txns24h.sells} sells` : "—"}</dd>
                <dt>FDV</dt>
                <dd>{fmtUsdCompact(market.fdvUsd)}</dd>
                <dt>Pool</dt>
                <dd>
                  {market.dex} · {market.quoteSymbol} ·{" "}
                  {market.dexscreenerUrl ? (
                    <a href={market.dexscreenerUrl} target="_blank" rel="noopener noreferrer">
                      {shortAddr(market.pairAddress)}
                    </a>
                  ) : (
                    shortAddr(market.pairAddress)
                  )}
                </dd>
                <dt>Pool created</dt>
                <dd>{fmtDate(market.pairCreatedAt)}</dd>
              </dl>
            ) : (
              <p className="prose" style={{ fontSize: "0.92rem" }}>
                {record.tokenAddress ? "No pool is indexed for the attested contract. No price is shown because none can be verified." : "No attested token contract, so no market is quoted."}
              </p>
            )}
          </section>

          <section className="card">
            <h3>
              Token <Src label="Blockscout" state={sources.blockscout.state} detail={sources.blockscout.detail} />
            </h3>
            {token ? (
              <dl className="kv">
                <dt>Contract</dt>
                <dd>
                  <a href={token.explorerUrl} target="_blank" rel="noopener noreferrer">
                    {shortAddr(token.address)}
                  </a>
                </dd>
                <dt>Name · symbol</dt>
                <dd>
                  {token.name ?? "—"} · {token.symbol ?? "—"}
                </dd>
                <dt>Holders</dt>
                <dd>{fmtInt(token.holders)}</dd>
                <dt>Top 10 share</dt>
                <dd>{fmtShare(token.top10Share)}</dd>
                <dt>Total supply</dt>
                <dd>{fmtSupply(token.totalSupply, token.decimals)}</dd>
              </dl>
            ) : (
              <p className="prose" style={{ fontSize: "0.92rem" }}>
                {sources.blockscout.state === "skipped" ? "No attested contract." : `Explorer and RPC both failed: ${sources.blockscout.detail ?? "unknown"}.`}
              </p>
            )}
          </section>

          <section className="card">
            <h3>
              Site <Src label="Direct check" state={sources.liveness.state} />
            </h3>
            {liveness ? (
              <dl className="kv">
                <dt>Status</dt>
                <dd className={liveness.ok ? "up" : "down"}>{liveness.ok ? `up · HTTP ${liveness.httpStatus}` : `down · ${liveness.detail ?? "no response"}`}</dd>
                <dt>Latency</dt>
                <dd>{liveness.latencyMs !== null ? `${liveness.latencyMs} ms` : "—"}</dd>
                <dt>Checked</dt>
                <dd>{timeAgo(snap.fetchedAt)}</dd>
              </dl>
            ) : (
              <p className="prose" style={{ fontSize: "0.92rem" }}>
                No website on record.
              </p>
            )}
          </section>

          <section className="card" id="economy">
            <h3>Reported economy</h3>
            {reports.length === 0 ? (
              <p className="prose" style={{ fontSize: "0.92rem" }}>
                No studio-reported figures yet. Studios can submit DAU, faucets, sinks and marketplace volume through the{" "}
                <Link href="/developers#economy" style={{ color: "var(--accent)" }}>
                  economy ingest contract
                </Link>
                .
              </p>
            ) : (
              <dl className="kv">
                <dt>Reports</dt>
                <dd>{reports.length}</dd>
                <dt>Latest</dt>
                <dd>{fmtDate(reports.at(-1)?.reportedAt)}</dd>
                <dt>Latest DAU</dt>
                <dd>{fmtInt(reports.at(-1)?.dau)}</dd>
                <dt>Sink / faucet (7)</dt>
                <dd>{ratio === null ? "—" : ratio === Infinity ? "∞" : ratio.toFixed(2)}</dd>
              </dl>
            )}
          </section>

          <section className="trader">
            <p className="gg">
              <span className="pulse-dot" style={{ background: tradeable ? "var(--good)" : "var(--line-strong)" }} aria-hidden="true" />
              Trader panel
            </p>
            <p>Position handoff for {record.ticker ? `$${record.ticker}` : "this title"} into a partner trading venue. Calls and entries would sit here.</p>
            <span className="btn btn-primary" aria-disabled="true" role="button">
              {tradeable ? "Trade — venue not connected" : "No tradeable market"}
            </span>
            <p className="stub">Deliberately unwired. Integration is gated on a partner venue confirming Robinhood Chain asset support. Nothing on this page is a recommendation to trade.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
