import { CopyAction } from "@/components/CopyAction";
import { SourceCoverage } from "@/components/SourceCoverage";
import { GameLogo } from "@/components/GameLogo";
import { GameLinks } from "@/components/GameLinks";
import { MarketPanel } from "@/components/MarketPanel";
import { SaveGame } from "@/components/SaveGame";
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
    <div className="page-wrap game-detail-page" style={{ ["--band" as string]: band }}>
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
          <div className="detail-identity"><GameLogo record={record} large/><h1>{record.name}</h1></div>
          <div className="detail-sub">
            {record.ticker && <span className="tick">${record.ticker}</span>}
            <span className="band-pill">Directory record</span>
          </div>
          <p className="lead" style={{ marginTop: 16, fontSize: "1.05rem" }}>
            {record.summary}
          </p>
        </div>
        <div className="score-big">
          <p className="eyebrow">Evidence coverage</p>
          <div className="n">{screen.coverage.observed}/{screen.coverage.required}</div>
          <p className="eyebrow" style={{ marginTop: 6 }}>
            criteria observed
          </p>
        </div>
      </header>

      <div className="detail-actions">
        {record.website && <a className="btn btn-primary" href={record.website} target="_blank" rel="noopener noreferrer">{record.status === "dormant" ? "Last known website ↗" : "Visit official website ↗"}</a>}
        <SaveGame id={record.id} name={record.name}/><CopyAction label="Share listing"/>
        <p>You leave Greenwood to play. Check entry requirements on the official site.</p>
      </div>
      <section className="player-facts"><h2>Before you jump in</h2><dl><div><dt>Build evidence</dt><dd>{record.playable === true ? 'Previously checked by Greenwood' : record.playable === null ? 'Playability not established' : 'No current build verified'}</dd></div><div><dt>Platform</dt><dd>{record.playerInfo?.platform ?? 'Not established'}</dd></div><div><dt>Entry</dt><dd>{record.playerInfo?.entry ?? (record.tokenGated ? 'Token required in recorded rules' : 'Not established')}</dd></div><div><dt>Wallet</dt><dd>{record.playerInfo?.wallet ?? 'Not established'}</dd></div></dl>{record.playerInfo && <p>Entry details reported by the project, checked {record.playerInfo.checkedAt}. <a href={record.playerInfo.sourceUrl} target="_blank" rel="noopener noreferrer">Source ↗</a></p>}{record.tokenAddress && <div className="contract-copy"><span>Robinhood Chain · 4663</span><code>{record.tokenAddress}</code><CopyAction label="Copy contract" value={record.tokenAddress}/></div>}</section>
      <SourceCoverage snapshot={snap}/>
      <section className="listing-links" aria-labelledby="listing-links-title">
        <h2 id="listing-links-title">Around the game</h2>
        <p>Project destinations and independent token references. Links open in a new tab; availability can change.</p>
        <GameLinks record={record} full/>
        <p className="link-provenance">{record.logo ? <>Logo and additional destinations checked {record.logo.checkedAt}. <a href={record.logo.sourceUrl} target="_blank" rel="noopener noreferrer">Original logo source ↗</a></> : 'Official logo not yet confirmed. A placeholder is shown.'} Social links follow the dated directory record; missing channels are omitted.</p>
      </section>

      <p className="screen-caveat">Evidence coverage is not a safety rating. Incomplete checks have no total; a failed request cannot establish that a game is dead or a pool is empty.</p>
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
                        <i style={{ width: `${c.score ?? 0}%`, background: scoreColor(c.score) }} />
                      </span>
                      <span className="basis">{c.basis}</span>
                    </span>
                    <span className="val" style={{ color: scoreColor(c.score) }}>
                      {c.score ?? "Unknown"}
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

          <section className="card" id="evidence">
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
          <MarketPanel snapshot={snap} renderedAt={Date.now()}/>

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
                <dd className={liveness.ok === true ? "up" : liveness.ok === false ? "down" : ""}>{liveness.ok === true ? `Responded · HTTP ${liveness.httpStatus}` : liveness.ok === false ? `Unavailable · HTTP ${liveness.httpStatus}` : `Check unavailable · ${liveness.detail ?? "unknown"}`}</dd>
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
                No studio-reported figures yet. New submissions are disabled while the reporting system is hardened. Read the{" "}
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

          <section className="card"><h3>Check the receipts</h3><p className="prose">Confirm the chain, contract and official destination before connecting a wallet elsewhere.</p><Link className="text-link" href="/method">Read the field guide ↗</Link></section>
        </aside>
      </div>
    </div>
  );
}
