import { blockscoutUrl, explorerTokenUrl } from "../chain.js";
import { fetchJson } from "../http.js";
import type { Address, TokenData } from "../types.js";

interface BsToken {
  address_hash: string;
  name: string | null;
  symbol: string | null;
  decimals: string | null;
  total_supply: string | null;
  holders_count?: string | null;
  holders?: string | null;
  exchange_rate?: string | null;
  type?: string;
}

interface BsHolder {
  address: { hash: string };
  value: string;
}

interface BsSearchItem {
  type: string;
  address_hash?: string;
  name?: string;
  symbol?: string;
  token_type?: string;
  total_supply?: string;
  is_smart_contract_verified?: boolean;
}

export async function tokenInfo(address: Address): Promise<TokenData> {
  const t = await fetchJson<BsToken>(`${blockscoutUrl()}/api/v2/tokens/${address}`);
  if (t.address_hash && t.address_hash.toLowerCase() !== address.toLowerCase()) throw new Error("Token metadata identity mismatch");
  const holdersRaw = t.holders_count ?? t.holders ?? null;
  return {
    address,
    name: t.name ?? null,
    symbol: t.symbol ?? null,
    decimals: t.decimals ? Number(t.decimals) : null,
    totalSupply: t.total_supply ?? null,
    holders: holdersRaw !== null && Number.isSafeInteger(Number(holdersRaw)) && Number(holdersRaw) >= 0 ? Number(holdersRaw) : null,
    top10Share: null,
    explorerUrl: explorerTokenUrl(address),
  };
}

/** Share of supply in the top ten holders. Best effort; the endpoint is flaky on this instance. */
export async function top10Share(address: Address, totalSupply: string | null): Promise<number | null> {
  if (!totalSupply || totalSupply === "0") return null;
  const res = await fetchJson<{ items: BsHolder[] }>(`${blockscoutUrl()}/api/v2/tokens/${address}/holders`);
  const top = res.items.slice(0, 10);
  if (top.length === 0) return null;
  const sum = top.reduce((acc, h) => acc + BigInt(h.value), 0n);
  const supply = BigInt(totalSupply);
  if (sum < 0n || supply <= 0n || sum > supply) throw new Error("Invalid holder concentration");
  // Two decimal places of precision is plenty for a share.
  return Number((sum * 10_000n) / supply) / 10_000;
}

export interface ContractCandidate {
  address: Address;
  name: string | null;
  symbol: string | null;
  tokenType: string | null;
  verified: boolean;
}

/**
 * Name search on Blockscout. This is a *discovery* aid only. It returns every
 * contract carrying a name, which on this chain is how you find six Senkais.
 * Nothing here is ever written into the registry without project attestation.
 */
export async function searchContracts(query: string): Promise<ContractCandidate[]> {
  const res = await fetchJson<{ items: BsSearchItem[] }>(`${blockscoutUrl()}/api/v2/search?q=${encodeURIComponent(query)}`);
  return res.items
    .filter((i) => i.type === "token" && i.address_hash)
    .map((i) => ({
      address: i.address_hash as Address,
      name: i.name ?? null,
      symbol: i.symbol ?? null,
      tokenType: i.token_type ?? null,
      verified: Boolean(i.is_smart_contract_verified),
    }));
}

export interface BlockscoutStats {
  averageBlockTimeMs: number | null;
  totalAddresses: number | null;
  totalBlocks: number | null;
  gasPriceGwei: { slow: number; average: number; fast: number } | null;
  ethPriceUsd: number | null;
}

export async function chainStats(): Promise<BlockscoutStats> {
  const s = await fetchJson<{
    average_block_time?: number;
    total_addresses?: string;
    total_blocks?: string;
    gas_prices?: { slow: number; average: number; fast: number } | null;
    coin_price?: string | null;
  }>(`${blockscoutUrl()}/api/v2/stats`);
  return {
    averageBlockTimeMs: s.average_block_time ?? null,
    totalAddresses: s.total_addresses ? Number(s.total_addresses) : null,
    totalBlocks: s.total_blocks ? Number(s.total_blocks) : null,
    gasPriceGwei: s.gas_prices ?? null,
    ethPriceUsd: s.coin_price ? Number(s.coin_price) : null,
  };
}
