export function fmtInt(n: number | null | undefined): string {
  return n === null || n === undefined ? "—" : n.toLocaleString("en-GB");
}

export function fmtUsdCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
}

/** Prices on this chain range from 0.0002 to 5e-19. Show what a person can read. */
export function fmtPrice(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n === 0) return "$0";
  if (n >= 1) return `$${n.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
  if (n >= 0.0001) return `$${n.toFixed(6).replace(/0+$/, "")}`;
  return `$${n.toExponential(3)}`;
}

export function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function fmtShare(n: number | null | undefined): string {
  return n === null || n === undefined ? "—" : `${(n * 100).toFixed(1)}%`;
}

export function fmtSupply(raw: string | null | undefined, decimals: number | null | undefined): string {
  if (!raw) return "—";
  const d = decimals ?? 18;
  try {
    const big = BigInt(raw);
    const whole = big / 10n ** BigInt(d);
    return Number(whole).toLocaleString("en-GB");
  } catch {
    return raw;
  }
}

export function shortAddr(a: string | null | undefined): string {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });
}

export function bandColor(band: string): string {
  switch (band) {
    case "sound":
      return "var(--good)";
    case "watch":
      return "var(--caution)";
    case "avoid":
      return "var(--risk)";
    default:
      return "var(--line-strong)";
  }
}

export function scoreColor(score: number): string {
  return score >= 65 ? "var(--good)" : score >= 45 ? "var(--caution)" : "var(--risk)";
}
