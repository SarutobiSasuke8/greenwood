import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { getRecord } from "./registry.js";
import type { EconomyReport } from "./types.js";

/**
 * Studio-reported economy data.
 *
 * On-chain data tells you about the token. It cannot tell you whether the game
 * economy behind it is sinking more than it faucets, or whether anyone logs in.
 * This is the contract studios use to report that, and the store behind it.
 * File-backed on purpose: one JSON file per game, append-only, no database to run.
 */

export const economyReportSchema = z.object({
  reportedAt: z.string().datetime(),
  period: z.enum(["day", "week"]),
  dau: z.number().int().nonnegative().nullable().default(null),
  wau: z.number().int().nonnegative().nullable().default(null),
  newWallets: z.number().int().nonnegative().nullable().default(null),
  faucetUnits: z.number().nonnegative().nullable().default(null),
  sinkUnits: z.number().nonnegative().nullable().default(null),
  marketplaceVolumeUnits: z.number().nonnegative().nullable().default(null),
  custom: z.record(z.string().max(48), z.number()).optional(),
  source: z.string().min(1).max(200),
});

export type EconomyReportInput = z.input<typeof economyReportSchema>;

function dataDir(): string {
  return join(process.env.GREENWOOD_DATA_DIR?.trim() || "./data", "economy");
}

function fileFor(gameId: string): string {
  return join(dataDir(), `${gameId}.json`);
}

export async function listEconomyReports(gameId: string): Promise<EconomyReport[]> {
  if (!getRecord(gameId)) throw new Error(`Unknown game id: ${gameId}`);
  try {
    const raw = await readFile(fileFor(gameId), "utf8");
    const records: unknown = JSON.parse(raw);
    if (!Array.isArray(records)) throw new Error('Invalid report history');
    return records.map(item => { if (item.gameId !== gameId) throw new Error('Report identity mismatch'); return { gameId, ...economyReportSchema.parse(item) }; });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    return [];
  }
}

export async function appendEconomyReport(gameId: string, input: unknown): Promise<EconomyReport> {
  throw new Error("Studio ingestion is disabled pending scoped credentials and transactional storage.");
}

/** Sink/faucet ratio over the most recent N reports. >1 means the economy removes more than it issues. */
export function sinkFaucetRatio(reports: EconomyReport[], lastN = 7): number | null {
  const recent = reports.slice(-lastN).filter((r) => r.faucetUnits !== null && r.sinkUnits !== null);
  if (recent.length === 0) return null;
  const faucet = recent.reduce((a, r) => a + (r.faucetUnits ?? 0), 0);
  const sink = recent.reduce((a, r) => a + (r.sinkUnits ?? 0), 0);
  if (faucet === 0) return sink === 0 ? null : Infinity;
  return sink / faucet;
}
