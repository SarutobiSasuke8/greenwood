import Link from "next/link";
import type { ChainStatus } from "@greenwood/core";
import { FOOTER_GROUPS, SITE } from "@/lib/site";
import { Mark } from "./Mark";

const askPrompt = `I am assessing Greenwood (${SITE.url}), an independent game index for Robinhood Chain. Read ${SITE.url}, ${SITE.url}/method and ${SITE.url}/developers as primary sources, then tell me in plain English what it measures, how the five-part screen is scored, what data it refuses to show and why, and how a developer or agent would consume its API or MCP server. Base the answer only on those pages and label anything uncertain.`;
const q = encodeURIComponent(askPrompt);

function SourceRow({ label, href, state }: { label: string; href: string; state: "ok" | "error" | "skipped" | null }) {
  return (
    <li className="src-row">
      <a href={href} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
      <span className="src" data-state={state ?? "skipped"} title={state === "ok" ? "Reachable on the last refresh" : state === "error" ? "Failed on the last refresh" : "Not checked"}>
        <i aria-hidden="true" />
        {state === "ok" ? "live" : state === "error" ? "down" : "—"}
      </span>
    </li>
  );
}

export function SiteFooter({ chain }: { chain: ChainStatus | null }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="page-wrap footer-grid">
        <div className="footer-brand">
          <div className="brand" style={{ display: "inline-flex" }}>
            <Mark />
            <span className="brand-name">Greenwood</span>
          </div>
          <p className="footer-tagline">{SITE.tagline}</p>
          <div className="footer-facts">
            <span>Robinhood Chain · chain id {SITE.chainId} · Arbitrum Nitro L2</span>
            <span>Data refreshed every {SITE.refreshSeconds / 60} minutes · nothing backfilled</span>
            <span>
              <a href={SITE.github} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>{" "}
              ·{" "}
              <a href={SITE.x} target="_blank" rel="me noopener noreferrer">
                X
              </a>
            </span>
          </div>
        </div>

        <nav className="footer-directory" aria-label="Footer">
          {FOOTER_GROUPS.map((group) => (
            <section key={group.label} aria-labelledby={`footer-${group.label.toLowerCase()}`}>
              <p id={`footer-${group.label.toLowerCase()}`} className="footer-heading">
                {group.label}
              </p>
              <ul>
                {group.links.map((l) =>
                  l.href.startsWith("http") ? (
                    <li key={l.href}>
                      <a href={l.href} target="_blank" rel="noopener noreferrer">
                        {l.label}
                      </a>
                    </li>
                  ) : (
                    <li key={l.href}>
                      <Link href={l.href}>{l.label}</Link>
                    </li>
                  ),
                )}
              </ul>
            </section>
          ))}
          <section aria-labelledby="footer-sources">
            <p id="footer-sources" className="footer-heading">
              Data sources
            </p>
            <ul>
              <SourceRow label="Robinhood Chain RPC" href="https://docs.robinhood.com/chain/connecting/" state={chain?.rpc.state ?? null} />
              <SourceRow label="Blockscout explorer" href="https://robinhoodchain.blockscout.com/" state={chain?.blockscout.state ?? null} />
              <SourceRow label="DexScreener" href="https://dexscreener.com/robinhood" state="ok" />
              <li>
                <a href="https://www.playhood.buzz/" target="_blank" rel="noopener noreferrer">
                  PLAYHOOD (prior art)
                </a>
              </li>
            </ul>
          </section>
        </nav>
      </div>

      <div className="page-wrap footer-ai">
        <p>Ask an assistant to summarise Greenwood from its own pages</p>
        <ul aria-label="Ask an AI assistant">
          <li>
            <a href={`https://claude.ai/new?q=${q}`} target="_blank" rel="noopener noreferrer">
              Claude
            </a>
          </li>
          <li>
            <a href={`https://chatgpt.com/?q=${q}`} target="_blank" rel="noopener noreferrer">
              ChatGPT
            </a>
          </li>
          <li>
            <a href={`https://www.perplexity.ai/?q=${q}`} target="_blank" rel="noopener noreferrer">
              Perplexity
            </a>
          </li>
          <li>
            <a href={`https://grok.com/?q=${q}`} target="_blank" rel="noopener noreferrer">
              Grok
            </a>
          </li>
        </ul>
      </div>

      <div className="page-wrap footer-bottom">
        <p>© {year} Greenwood. Independent. Not affiliated with Robinhood Markets, Inc.</p>
        <p>
          Not investment advice. Prices from DexScreener, holders from Blockscout, liveness checked directly. <Link href="/method#rules">Data rules</Link>
        </p>
      </div>
    </footer>
  );
}
