"use client";
import { useEffect, useState } from "react";
const KEY = "greenwood:watchlist:v1";
const EVENT = "greenwood:watchlist";
function read(): string[] {
  const data: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  return Array.isArray(data) ? data.filter((x): x is string => typeof x === "string" && /^[a-z0-9-]{1,80}$/.test(x)).slice(0,500) : [];
}
export function useWatchlist() {
  const [saved, setSaved] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const sync = () => { try { setSaved(read()); } catch { setError("Browser storage is unavailable. Your watchlist cannot be saved here."); } setReady(true); };
    sync(); window.addEventListener("storage", sync); window.addEventListener(EVENT, sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener(EVENT, sync); };
  }, []);
  function toggle(id: string) {
    try {
      const current = read();
      const next = current.includes(id) ? current.filter(x => x !== id) : [...current,id];
      localStorage.setItem(KEY,JSON.stringify(next)); setSaved(next); setError(""); window.dispatchEvent(new Event(EVENT));
    } catch { setError("Could not save this game. Allow browser storage and try again."); }
  }
  return { saved, ready, error, toggle };
}
