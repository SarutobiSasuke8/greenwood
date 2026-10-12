"use client";
import Link from "next/link";
import { GameLogo } from "./GameLogo";
import { TokenContract } from "./TokenContract";
import { GameLinks } from "./GameLinks";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GameSnapshot } from "@greenwood/core";
import { fmtPct, fmtPrice, fmtUsdCompact } from "@/lib/format";
import { marketView } from "@/lib/market-view";
import { useWatchlist } from "@/lib/watchlist";

type Filter = "all" | "playable" | "market" | "saved";
type Sort = "name" | "liquidity" | "change";
export function GameIndex({ snapshots, renderedAt, defaultFilter = "all" }: { snapshots: GameSnapshot[]; renderedAt: number; defaultFilter?: Filter }) {
  const [data,setData] = useState(snapshots);
  const [now,setNow] = useState(renderedAt);
  const [failed,setFailed] = useState(false);
  const [loading,setLoading] = useState(false);
  const [filter,setFilter] = useState<Filter>(defaultFilter);
  const [sort,setSort] = useState<Sort>("name");
  const [view,setView] = useState("cards");
  const [q,setQ] = useState("");
  const [genre,setGenre] = useState('');
  const [entry,setEntry] = useState('');
  const [platform,setPlatform] = useState('');
  const { saved, ready, error, toggle } = useWatchlist();
  const refreshRef = useRef<() => void>(() => {});
  useEffect(() => {
    const sync = () => {
      const p = new URLSearchParams(location.search);
      const f = p.get("filter"); setFilter(f === "all" || f === "playable" || f === "market" || f === "saved" ? f : defaultFilter);
      const s = p.get("sort"); setSort(s === "liquidity" || s === "change" ? s : "name");
      setGenre(p.get("genre") ?? ""); setEntry(p.get("entry") ?? ""); setPlatform(p.get("platform") ?? "");
      setQ(p.get("q") ?? ""); setView(p.get("view") === "list" ? "list" : "cards");
    };
    sync(); window.addEventListener("popstate",sync);
    return () => window.removeEventListener("popstate",sync);
  }, []);
  function updateUrl(changes: Record<string,string>) {
    const url = new URL(location.href);
    for (const [key,value] of Object.entries(changes)) value ? url.searchParams.set(key,value) : url.searchParams.delete(key);
    history.replaceState(history.state,"",url);
  }
  useEffect(() => {
    let alive = true; let busy = false; let controller: AbortController | undefined;
    const refresh = async () => {
      if (busy) return; busy = true; setLoading(true); controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(),15_000);
      try {
        const res = await fetch("/api/v1/games",{cache:"no-store",signal:controller.signal});
        if (!res.ok) throw new Error("refresh");
        const body = await res.json();
        if (!Array.isArray(body.games) || !body.games.every((g: GameSnapshot) => g.record?.id && g.sources?.dexscreener)) throw new Error("shape");
        if (alive) { setData(body.games); setFailed(false); setNow(Date.now()); }
      } catch { if (alive) setFailed(true); }
      finally { clearTimeout(timeout); busy=false; if (alive) setLoading(false); }
    };
    refreshRef.current = () => { void refresh(); };
    void refresh();
    const timer = setInterval(() => { setNow(Date.now()); if (!document.hidden) void refresh(); },60_000);
    const ageTimer = setInterval(() => setNow(Date.now()),15_000);
    const wake = () => { if (!document.hidden) { setNow(Date.now()); void refresh(); } };
    document.addEventListener("visibilitychange",wake);
    return () => { alive=false; controller?.abort(); clearInterval(timer); clearInterval(ageTimer); document.removeEventListener("visibilitychange",wake); };
  }, []);
  const rows = useMemo(() => {
    const query=q.trim().toLowerCase();
    return data.filter(s => {
      if (genre && s.record.genre !== genre) return false;
      if (platform && (s.record.playerInfo?.platform ?? 'unknown') !== platform) return false;
      const access = s.record.playerInfo?.entry ?? (s.record.tokenGated ? 'token' : 'unknown');
      if (entry && access !== entry) return false;
      if (filter === "saved" && !saved.includes(s.record.id)) return false;
      if (filter === "playable" && s.record.playable !== true) return false;
      if (filter === "market" && !marketView(s,now,failed).eligible) return false;
      return `${s.record.name} ${s.record.ticker ?? ""} ${s.record.genre}`.toLowerCase().includes(query);
    }).sort((a,b) => {
      const av=marketView(a,now,failed), bv=marketView(b,now,failed);
      if(sort === "name") return a.record.name.localeCompare(b.record.name);
      const x=sort === "change" ? av.change : av.liquidity;
      const y=sort === "change" ? bv.change : bv.liquidity;
      if(x === null && y === null) return a.record.name.localeCompare(b.record.name);
      if(x === null) return 1; if(y === null) return -1; return y-x;
    });
  },[data,filter,sort,q,genre,entry,platform,saved,now,failed]);
  const available=rows.filter(s=>marketView(s,now,failed).eligible).length;
  return <div className="discovery">
    <div className="catalogue-heading"><div><p className="eyebrow">THE DIRECTORY</p><h2>Find your rabbit hole.</h2></div><p>Small ecosystem. Look closely.<br/>Every listing has a story worth checking.</p></div>
    <div className="discovery-toolbar">
      <div className="discovery-tabs" role="group" aria-label="Filter games">
        {([['all','All games'],['playable','Build checked'],['market','With quotes'],['saved',`Watchlist (${ready ? saved.length : 0})`]] as const).map(([key,label])=><button key={key} aria-pressed={filter===key} onClick={()=>{setFilter(key);updateUrl({filter:key===defaultFilter?'':key});}}>{label}</button>)}
      </div>
      <label className="directory-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search games" placeholder="Game, ticker or genre" value={q} onChange={e=>{setQ(e.target.value);updateUrl({q:e.target.value});}}/></label>
    </div>
    <div className="advanced-filters">
      <label>Genre<select value={genre} onChange={e=>{setGenre(e.target.value);updateUrl({genre:e.target.value});}}><option value="">All genres</option>{[...new Set(data.map(s=>s.record.genre))].sort().map(g=><option key={g}>{g}</option>)}</select></label>
      <label>Entry<select value={entry} onChange={e=>{setEntry(e.target.value);updateUrl({entry:e.target.value});}}><option value="">Any entry</option><option value="free">Free entry reported</option><option value="token">Token required</option><option value="paid">Paid entry reported</option><option value="unknown">Not established</option></select></label>
      <label>Platform<select value={platform} onChange={e=>{setPlatform(e.target.value);updateUrl({platform:e.target.value});}}><option value="">Any platform</option><option value="browser">Browser confirmed</option><option value="unknown">Not established</option></select></label>
      <button className="text-button" onClick={()=>{setGenre('');setEntry('');setPlatform('');setQ('');setFilter('all');updateUrl({genre:'',entry:'',platform:'',q:'',filter:defaultFilter==='all'?'':'all'});}}>Reset filters</button>
    </div>
    <div className="results-tools"><p aria-live="polite">{rows.length} {rows.length===1?'game':'games'} <span>· {available} with displayable quotes</span></p><div><label htmlFor="directory-sort">Sort</label><select id="directory-sort" value={sort} onChange={e=>{setSort(e.target.value as Sort);updateUrl({sort:e.target.value});}}><option value="name">A to Z</option><option value="liquidity">Liquidity</option><option value="change">24h move</option></select><div className="view-switch" role="group" aria-label="Layout"><button aria-pressed={view==='cards'} onClick={()=>{setView('cards');updateUrl({view:''});}}>Cards</button><button aria-pressed={view==='list'} onClick={()=>{setView('list');updateUrl({view:'list'});}}>List</button></div></div></div>
    {error && <p className="notice" role="alert">{error}</p>}
    {failed && <p className="notice" role="status">Refresh unavailable. Current market figures are hidden until a request succeeds.</p>}
    {rows.length===0 ? <div className="directory-empty"><h3>{filter==='saved' && saved.length===0 && !q.trim()?'Your next obsession goes here.':'No games match this view.'}</h3><p>{filter==='saved' && saved.length===0 && !q.trim()?'Save a game to keep it on your radar. Your watchlist stays in this browser.':'Try a different name or browse the full directory.'}</p><button className="btn btn-secondary" onClick={()=>{setFilter('all');setQ('');setGenre('');setEntry('');setPlatform('');updateUrl({filter:defaultFilter==='all'?'':'all',q:'',genre:'',entry:'',platform:''});}}>Browse all games</button></div> : <div className={`game-grid${view==='list'?' as-list':''}`}>
      {rows.map((s)=>{
        const m=marketView(s,now,failed), r=s.record;
        return <article className="game-card" key={r.id} data-status={r.status}>
          <div className="game-card-top"><span className="listing-state" data-checked={r.playable===true}>{r.playable===true?'BUILD CHECKED':r.status==='pre-launch'?'PRE-LAUNCH':r.status==='dormant'?'LISTED DORMANT':'IN THE DIRECTORY'}</span><button className="save-button" disabled={!ready} aria-pressed={saved.includes(r.id)} aria-label={`${saved.includes(r.id)?'Unsave':'Save'} ${r.name}`} onClick={()=>toggle(r.id)}>{saved.includes(r.id)?'✓':'+'}</button></div>
          <div className="game-card-title"><GameLogo record={r}/><div><h3><Link href={`/games/${r.id}`}>{r.name}</Link></h3><p>{r.ticker?`$${r.ticker}`:'No ticker recorded'}</p></div></div>
          <p className="game-genre">{r.genre}</p>
          <p className="entry-note">{r.playerInfo ? `${r.playerInfo.platform} · ${r.playerInfo.entry} entry reported` : r.tokenGated ? 'Token required in recorded entry rules' : 'Entry requirements not established'}</p>
          <GameLinks record={r}/><TokenContract record={r}/>
          <dl className="card-market"><div><dt>Price</dt><dd>{m.price===null?'Unavailable':fmtPrice(m.price)}</dd></div><div><dt>24h</dt><dd className={m.change===null?'':m.change>=0?'up':'down'}>{m.change===null?'N/A':fmtPct(m.change)}</dd></div><div><dt>Pool liquidity</dt><dd>{m.liquidity===null?'N/A':fmtUsdCompact(m.liquidity)}</dd></div></dl>
          <p className="quote-note">{m.eligible ? 'DexScreener · refreshed '+new Date(m.timestamp!).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'})+' UTC' : m.reason}</p>
          <div className="game-card-bottom"><span>Evidence · {r.lastVerified}</span><Link href={`/games/${r.id}`} aria-label={`Explore ${r.name}`}>Explore <span aria-hidden="true">↗</span></Link></div>
        </article>;
      })}
    </div>}
    <div className="directory-caption"><p>Market observations, not trade recommendations. No wallet needed to browse.<br/>Quotes expire after 10 minutes. Pools below $100 liquidity are not priced.</p><button className="text-button" disabled={loading} onClick={()=>refreshRef.current()}>{loading?'Refreshing…':'Refresh data ↻'}</button></div>
  </div>;
}
