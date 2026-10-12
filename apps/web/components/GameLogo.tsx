"use client";
import Image from "next/image";
import { useState } from "react";
import type { GameRecord } from "@greenwood/core";

export function GameLogo({ record, large = false }: { record: GameRecord; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const logo = record.logo;
  return <span className={`game-logo${large ? ' game-logo-large' : ''}`}>
    {logo && !failed
      ? <Image src={logo.path} width={large ? 80 : 56} height={large ? 80 : 56} alt={`${record.name} logo`} onError={() => setFailed(true)} title={`Project asset checked ${logo.checkedAt}`} />
      : <span className="game-monogram" role="img" aria-label={`${record.name}: logo unavailable`} title="Official logo not yet available">{record.name.replace(/^The /, '').slice(0, 2).toUpperCase()}</span>}
  </span>;
}
