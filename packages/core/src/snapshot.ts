import { currentBlockNumber, readErc20, explorerTokenUrl, ROBINHOOD_CHAIN_ID } from "./chain.js";
import { nowIso } from "./http.js";
import { chainStats, tokenInfo, top10Share } from "./providers/blockscout.js";
import { marketByTokens } from "./providers/dexscreener.js";
import { checkSite } from "./providers/liveness.js";
import { listRecords, getRecord } from "./registry.js";
import { buildScreen } from "./screen.js";
import type { Address, ChainStatus, GameRecord, GameSnapshot, MarketData, SourceStatus, TokenData } from "./types.js";

const ok = (): SourceStatus => ({ state: "ok", fetchedAt: nowIso() });
const skipped = (detail: string): SourceStatus => ({ state: "skipped", fetchedAt: null, detail });
const failed = (err: unknown): SourceStatus => ({ state: "error", fetchedAt: nowIso(), detail: err instanceof Error ? err.message : String(err) });

export interface SnapshotOptions {
  /** Skip the site check (fast path for the MCP list tool). */
  skipLiveness?: boolean;
  /** Skip the top-holders call, which is slow and flaky on this explorer. */
  skipHolders?: boolean;
}

async function tokenFor(record: GameRecord, opts: SnapshotOptions): Promise<{ token: TokenData | null; status: SourceStatus; holders?: SourceStatus }> {
  if (!record.tokenAddress) return { token: null, status: skipped("No attested token contract.") };
  try {
    const info = await tokenInfo(record.tokenAddress);
    let holders: SourceStatus = skipped("Holder concentration check skipped.");
    if (!opts.skipHolders) {
      try {
        info.top10Share = await top10Share(record.tokenAddress, info.totalSupply);
        holders = info.top10Share === null ? skipped("Holder concentration unavailable.") : ok();
      } catch (err) {
        holders = failed(err);
        info.top10Share = null;
      }
    }
    return { token: info, status: ok(), holders };
  } catch (err) {
    // Fall back to the contract itself for metadata. Holders stay null; the RPC cannot count them.
    try {
      const meta = await readErc20(record.tokenAddress);
      return {
        token: { address: record.tokenAddress, ...meta, holders: null, top10Share: null, explorerUrl: explorerTokenUrl(record.tokenAddress) },
        status: { state: "error", fetchedAt: nowIso(), detail: `Explorer failed (${(err as Error).message}); metadata read from the contract over RPC.` },
      };
    } catch (rpcErr) {
      return { token: null, status: failed(rpcErr) };
    }
  }
}

export async function snapshotAll(opts: SnapshotOptions = {}): Promise<GameSnapshot[]> {
  const records = listRecords();
  const addresses = records.map((r) => r.tokenAddress).filter((a): a is Address => Boolean(a));

  let markets = new Map<string, MarketData>();
  let marketStatus: SourceStatus;
  try {
    markets = await marketByTokens(addresses);
    marketStatus = ok();
  } catch (err) {
    marketStatus = failed(err);
  }

  return Promise.all(
    records.map(async (record) => {
      const [{ token, status: tokenStatus, holders }, live] = await Promise.all([
        tokenFor(record, opts),
        record.website && !opts.skipLiveness ? checkSite(record.website) : Promise.resolve(null),
      ]);
      const market = record.tokenAddress ? (markets.get(record.tokenAddress.toLowerCase()) ?? null) : null;
      const dexStatus: SourceStatus = record.tokenAddress ? marketStatus : skipped("No attested token contract.");
      const liveStatus: SourceStatus = !record.website ? skipped("No website on record.") : opts.skipLiveness ? skipped("Liveness check skipped.") : live?.ok === null ? failed(live.detail ?? "Check unavailable") : ok();
      const partial = [dexStatus, tokenStatus, liveStatus, holders].some((s) => s?.state === "error") || Boolean(record.website && opts.skipLiveness) || Boolean(record.tokenAddress && (!holders || holders.state !== "ok"));
      return {
        record,
        market,
        token,
        liveness: live,
        screen: buildScreen(record, market, token, live, partial, dexStatus),
        sources: { dexscreener: dexStatus, blockscout: tokenStatus, liveness: liveStatus, holders: holders ?? skipped("No holder concentration observation available.") },
        fetchedAt: nowIso(),
        partial,
      };
    }),
  );
}

export async function snapshotOne(id: string, opts: SnapshotOptions = {}): Promise<GameSnapshot | null> {
  const record = getRecord(id);
  if (!record) return null;
  const all = await snapshotAll(opts);
  return all.find((s) => s.record.id === id) ?? null;
}

export async function chainStatus(): Promise<ChainStatus> {
  const [block, stats] = await Promise.allSettled([currentBlockNumber(), chainStats()]);
  const s = stats.status === "fulfilled" ? stats.value : null;
  return {
    chainId: ROBINHOOD_CHAIN_ID,
    name: "Robinhood Chain",
    blockNumber: block.status === "fulfilled" ? block.value : null,
    averageBlockTimeMs: s?.averageBlockTimeMs ?? null,
    totalAddresses: s?.totalAddresses ?? null,
    totalBlocks: s?.totalBlocks ?? null,
    gasPriceGwei: s?.gasPriceGwei ?? null,
    ethPriceUsd: s?.ethPriceUsd ?? null,
    rpc: block.status === "fulfilled" ? ok() : failed(block.reason),
    blockscout: stats.status === "fulfilled" ? ok() : failed(stats.reason),
    fetchedAt: nowIso(),
  };
}
