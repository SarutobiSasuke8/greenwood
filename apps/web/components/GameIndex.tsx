"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { GameSnapshot } from "@greenwood/core";
import { bandColor, fmtInt, fmtPct, fmtUsdCompact } from "@/lib/format";

type Filter = "all" | "playable" | "market" | "dormant" | "flagged";
type Sort = "screen" | "liquidity" | "change" | "holders" | "name";

export function GameIndex({ snapshots }: { snapshots: GameSnapshot[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("screen");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    let out = snapshots.filter((s) => {
      if (filter === "playable" && !(s.record.playable && s.liveness?.ok)) return false;
      if (filter === "market" && !(s.market && (s.market.liquidityUsd ?? 0) >= 100)) return false;
      if (filter === "dormant" && s.record.status !== "dormant") return false;
      if (filter === "flagged" && !s.screen.flags.some((f) => f.severity === "risk")) return false;
      if (query && !`${s.record.name} ${s.record.ticker ?? ""} ${s.record.genre}`.toLowerCase().includes(query)) return false;
      return true;
    });
    const num = (v: number | null | undefined) => (v === null || v === undefined ? -Infinity : v);
    out = [...out].sort((a, b) => {
      switch (sort) {
        case "liquidity":
          return num(b.market?.liquidityUsd) - num(a.market?.liquidityUsd);
        case "change":
          return num(b.market?.priceChange24h) - num(a.market?.priceChange24h);
        case "holders":
          return num(b.token?.holders) - num(a.token?.holders);
        case "name":
          return a.record.name.localeCompare(b.record.name);
        default:
          return num(b.screen.total) - num(a.screen.total);
      }
    });
    return out;
  }, [snapshots, filter, sort, q]);

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "playable", label: "Playable now" },
    { key: "market", label: "Has a market" },
    { key: "dormant", label: "Dormant" },
    { key: "flagged", label: "Flagged" },
  ];

  return (
    <div>
      <div className="controls">
        <input className="search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, ticker or genre" aria-label="Search the index" />
        <div className="chips" role="group" aria-label="Filter">
          {chips.map((c) => (
            <button key={c.key} type="button" className="chip" aria-pressed={filter === c.key} onClick={() => setFilter(c.key)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="sortwrap">
          <label htmlFor="sort" className="eyebrow">
            Sort
          </label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="screen">Screen score</option>
            <option value="liquidity">Liquidity</option>
            <option value="change">24h change</option>
            <option value="holders">Holders</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="index-head" aria-hidden="true">
        <span>#</span>
        <span>Title</span>
        <span className="r">Price</span>
        <span className="r">24h</span>
        <span className="r">Liquidity</span>
        <span className="r">Screen</span>
        <span>Flags</span>
      </div>

      {rows.length === 0 ? (
        <p className="empty">Nothing matches. Clear the search or choose another filter.</p>
      ) : (
        <div className="index-list">
          {rows.map((s, i) => {
            const band = bandColor(s.screen.band);
            const chg = s.market?.priceChange24h ?? null;
            return (
              <Link key={s.record.id} href={`/games/${s.record.id}`} className="index-row" style={{ ["--band" as string]: band }}>
                <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                <span className="namecell">
                  <span className="g-name">{s.record.name}</span>
                  <span className="g-meta">
                    <span className="tick">{s.record.ticker ? `$${s.record.ticker}` : "no token"}</span>
                    <span>{s.record.genre}</span>
                  </span>
                </span>
                <span className={`num r${s.market?.priceUsd == null ? " dim" : ""}`}>{s.market?.priceUsd == null ? "—" : priceCell(s.market.priceUsd)}</span>
                <span className={`num r ${chg === null ? "dim" : chg >= 0 ? "up" : "down"}`}>{fmtPct(chg)}</span>
                <span className={`num r${s.market?.liquidityUsd == null ? " dim" : ""}`} title={s.token?.holders != null ? `${fmtInt(s.token.holders)} holders` : undefined}>
                  {fmtUsdCompact(s.market?.liquidityUsd)}
                </span>
                <span className="screen-cell">
                  <span className="meter">
                    <i style={{ width: `${s.screen.total ?? 0}%` }} />
                  </span>
                  <span className="screen-val">{s.screen.total ?? "—"}</span>
                </span>
                <span className="flags">
                  {s.screen.flags.slice(0, 3).map((f) => (
                    <span key={f.label} className="flag" data-sev={f.severity} title={f.reason}>
                      {f.label}
                    </span>
                  ))}
                  {s.screen.flags.length > 3 && <span className="flag dim">+{s.screen.flags.length - 3}</span>}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function priceCell(n: number): string {
  if (n >= 0.0001) return `$${n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}`;
  return `$${n.toExponential(2)}`;
}
