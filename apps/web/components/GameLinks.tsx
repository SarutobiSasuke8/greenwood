import { LinkIcon } from "./LinkIcon";
import type { GameRecord } from "@greenwood/core";

export function GameLinks({ record, full = false }: { record: GameRecord; full?: boolean }) {
  const links: { label: string; url: string }[] = [];
  if (record.website) links.push({ label: record.status === 'dormant' ? 'Website (last known)' : 'Website', url: record.website });
  for (const [key, label] of [['x', 'X'], ['telegram', 'Telegram'], ['discord', 'Discord']] as const) {
    const url = record.socials[key];
    if (url) links.push({ label, url });
  }
  for (const item of record.resources ?? []) if (full || item.label !== 'Game app') links.push(item);
  if (record.tokenAddress) {
    links.push({ label: 'Token explorer', url: `https://robinhoodchain.blockscout.com/token/${record.tokenAddress}` });
    links.push({ label: 'DexScreener', url: `https://dexscreener.com/robinhood/${record.tokenAddress}` });
  }
  return <nav className={`game-links${full ? ' game-links-full' : ''}`} aria-label={`${record.name} ${full ? 'all links' : 'quick links'}`}>
    {links.length ? links.map(({ label, url }) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" aria-label={`${record.name}: ${label} (opens in new tab)`}><LinkIcon label={label}/>{label}<span aria-hidden="true"> ↗</span></a>) : <span className="muted">No confirmed destinations yet.</span>}
  </nav>;
}
