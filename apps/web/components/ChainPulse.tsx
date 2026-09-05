"use client";

import { useEffect, useState } from "react";
import type { ChainStatus } from "@greenwood/core";

/** Live block height in the header. Polls the public API once a minute. */
export function ChainPulse({ initial }: { initial: ChainStatus | null }) {
  const [chain, setChain] = useState<ChainStatus | null>(initial);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/v1/chain", { cache: "no-store" });
        if (res.ok && alive) setChain((await res.json()) as ChainStatus);
      } catch {
        /* keep the last good value; the dot shows state */
      }
    };
    const id = setInterval(tick, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const state = chain?.rpc.state ?? "error";
  return (
    <a className="pulse" data-state={state} href="/api/v1/chain" title="Robinhood Chain status from the public RPC">
      <span className="pulse-dot" aria-hidden="true" />
      <span>
        Chain 4663 · <b>{chain?.blockNumber ? `#${chain.blockNumber.toLocaleString("en-GB")}` : "RPC down"}</b>
      </span>
    </a>
  );
}
