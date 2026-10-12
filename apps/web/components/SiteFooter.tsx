import Link from "next/link";
import type { ChainStatus } from "@greenwood/core";
import { SITE } from "@/lib/site";
import { LinkIcon } from "./LinkIcon";
import { Mark } from "./Mark";
export function SiteFooter({chain:_chain}:{chain:ChainStatus|null}) {
 return <footer className="site-footer"><div className="page-wrap new-footer"><div><Link href="/" className="brand"><Mark/><span className="brand-name">Greenwood</span></Link><p>An independent field guide to Robinhood Chain games.</p></div><nav aria-label="Footer"><Link href="/contracts"><LinkIcon label="Contracts"/>Contracts</Link><Link href="/about"><LinkIcon label="About"/>About</Link><Link href="/method"><LinkIcon label="Method"/>Method</Link><Link href="/developers"><LinkIcon label="API"/>API</Link><Link href="/mcp"><LinkIcon label="MCP"/>MCP</Link><a href={SITE.github} target="_blank" rel="noopener noreferrer"><LinkIcon label="GitHub"/>GitHub ↗</a></nav></div><div className="page-wrap footer-bottom"><p>© {new Date().getFullYear()} Greenwood. Independent of Robinhood Markets, Inc.</p><p>Discover here. Play on the official sites. Nothing here is investment advice.</p></div></footer>;
}
