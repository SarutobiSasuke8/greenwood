import { createPublicClient, defineChain, erc20Abi, http, type PublicClient } from "viem";
import type { Address } from "./types.js";

export const ROBINHOOD_CHAIN_ID = 4663;

export const DEFAULT_RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
export const DEFAULT_BLOCKSCOUT_URL = "https://robinhoodchain.blockscout.com";

export function rpcUrl(): string {
  return process.env.GREENWOOD_RPC_URL?.trim() || DEFAULT_RPC_URL;
}

export function blockscoutUrl(): string {
  return (process.env.GREENWOOD_BLOCKSCOUT_URL?.trim() || DEFAULT_BLOCKSCOUT_URL).replace(/\/$/, "");
}

export const robinhoodChain = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl()] } },
  blockExplorers: { default: { name: "Blockscout", url: blockscoutUrl() } },
});

let client: PublicClient | null = null;

export function publicClient(): PublicClient {
  if (!client) {
    client = createPublicClient({
      chain: robinhoodChain,
      transport: http(rpcUrl(), { timeout: 10_000, retryCount: 1 }),
    });
  }
  return client;
}

export async function currentBlockNumber(): Promise<number> {
  const n = await publicClient().getBlockNumber();
  return Number(n);
}

export interface Erc20Metadata {
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  totalSupply: string | null;
}

/** Reads ERC-20 metadata straight from the contract. Independent of any indexer. */
export async function readErc20(address: Address): Promise<Erc20Metadata> {
  const c = publicClient();
  const [name, symbol, decimals, totalSupply] = await Promise.all([
    c.readContract({ address, abi: erc20Abi, functionName: "name" }).catch(() => null),
    c.readContract({ address, abi: erc20Abi, functionName: "symbol" }).catch(() => null),
    c.readContract({ address, abi: erc20Abi, functionName: "decimals" }).catch(() => null),
    c.readContract({ address, abi: erc20Abi, functionName: "totalSupply" }).catch(() => null),
  ]);
  return {
    name: name ?? null,
    symbol: symbol ?? null,
    decimals: decimals === null ? null : Number(decimals),
    totalSupply: totalSupply === null ? null : totalSupply.toString(),
  };
}

export function explorerTokenUrl(address: Address): string {
  return `${blockscoutUrl()}/token/${address}`;
}

export function explorerAddressUrl(address: Address): string {
  return `${blockscoutUrl()}/address/${address}`;
}
