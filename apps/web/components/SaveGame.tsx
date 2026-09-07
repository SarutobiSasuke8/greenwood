"use client";
import { useWatchlist } from "@/lib/watchlist";
export function SaveGame({ id, name }: { id: string; name: string }) {
  const { saved, ready, error, toggle } = useWatchlist();
  return <div><button className="btn btn-secondary" disabled={!ready} aria-pressed={saved.includes(id)} aria-label={`${saved.includes(id) ? "Unsave" : "Save"} ${name}`} onClick={() => toggle(id)}>{saved.includes(id) ? "Saved ✓" : "Save game +"}</button>{error && <p role="alert" className="storage-error">{error}</p>}</div>;
}
