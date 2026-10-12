"use client";
import { useEffect, useState } from "react";
import type { GameSnapshot } from "@greenwood/core";
import { marketView } from "@/lib/market-view";
import { fmtPrice,fmtPct,fmtUsdCompact,shortAddr } from "@/lib/format";
export function MarketPanel({snapshot,renderedAt}:{snapshot:GameSnapshot;renderedAt:number}) {
 const [now,setNow]=useState(renderedAt);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),15_000);return()=>clearInterval(t);},[]);
 const m=marketView(snapshot,now);
 return <section className="card market-panel"><p className="eyebrow">MARKET OBSERVATION / DEXSCREENER</p><h3>{m.price===null?'Quote unavailable':fmtPrice(m.price)}</h3><p className="quote-note">{m.eligible?'Fetched '+new Date(m.timestamp!).toUTCString():m.reason}</p><dl className="kv"><dt>24h move</dt><dd>{m.change===null?'Unavailable':fmtPct(m.change)}</dd><dt>Pool liquidity</dt><dd>{m.liquidity===null?'Unavailable':fmtUsdCompact(m.liquidity)}</dd><dt>24h volume</dt><dd>{m.volume===null?'Unavailable':fmtUsdCompact(m.volume)}</dd><dt>Pool address</dt><dd>{shortAddr(snapshot.market?.pairAddress)}</dd></dl>{snapshot.market?.dexscreenerUrl && <a className="btn btn-secondary" href={snapshot.market.dexscreenerUrl} target="_blank" rel="noopener noreferrer">View market source ↗</a>}<p className="stub">Pools below $100 are not priced here. Quotes expire after 10 minutes. Reload to request a newer snapshot.</p></section>;
}
