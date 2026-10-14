/**
 * Provider fixtures for tests. Test support only; nothing in the app imports this.
 *
 * DexScreener: recorded from `GET https://api.dexscreener.com/tokens/v1/robinhood/<registry tokens>`
 * on 2026-10-14, trimmed to the fields the provider reads (image and social `info` removed).
 * Yorozu had no indexed pool at recording time, which is kept: it exercises "no indexed pool".
 *
 * Blockscout: the instance sits behind a Cloudflare challenge and refused the recording
 * request (HTTP 403 HTML page, kept below as `BLOCKSCOUT_CHALLENGE_HTML`). The token, holder,
 * stats and search bodies are therefore shaped on the Blockscout v2 API with synthetic values.
 * Search results for "senkai" reuse the two unattested contracts already in the registry and
 * add synthetic look-alikes, so a name search returns several candidates, as it does on chain.
 *
 * RPC: `eth_blockNumber` recorded from the public Robinhood Chain RPC on 2026-10-14.
 *
 * Liveness: synthetic. Registry websites for `live` entries answer 200, `dormant` entries 404.
 */

export const RECORDED_AT = "2026-10-14";

export const DEXSCREENER_TOKENS = [
  {
    chainId: "robinhood",
    dexId: "uniswap",
    url: "https://dexscreener.com/robinhood/0x284aad3082e1cc90c75479bacb3230691723f84fdd004f847e5f4933bb8a0ad0",
    pairAddress: "0x284aad3082e1cc90c75479bacb3230691723f84fdd004f847e5f4933bb8a0ad0",
    labels: ["v4"],
    baseToken: { address: "0x0cc8522ca4F423638032d0211a6E823392A1eAe1", name: "PLAYGROUND", symbol: "PBUX" },
    quoteToken: { address: "0x0000000000000000000000000000000000000000", name: "Ether", symbol: "ETH" },
    priceNative: "0.00000002219",
    priceUsd: "0.00005557",
    txns: { m5: { buys: 0, sells: 0 }, h1: { buys: 0, sells: 0 }, h6: { buys: 3, sells: 0 }, h24: { buys: 8, sells: 13 } },
    volume: { h24: 3787.44, h6: 224.65, h1: 0, m5: 0 },
    priceChange: { h6: 4.27, h24: -28.94 },
    liquidity: { usd: 21840.58, base: 196511250, quote: 4.3618 },
    fdv: 55011,
    marketCap: 43761,
    pairCreatedAt: 1786031346000,
  },
  {
    chainId: "robinhood",
    dexId: "uniswap",
    url: "https://dexscreener.com/robinhood/0x596a9a9a9b9bd56b47b93949c3f6a823c5629200",
    pairAddress: "0x596A9A9a9B9bD56b47b93949c3f6A823C5629200",
    labels: ["v2"],
    baseToken: { address: "0xE44951407D2ed8E73dce4b7002908732BC0d0bC3", name: "Kindra by Virtuals", symbol: "KINDRA" },
    quoteToken: { address: "0xc6911796042b15d7Fa4F6CDe69e245DdCd3d9c31", name: "Virtuals Protocol", symbol: "VIRTUAL" },
    priceNative: "0.0007698",
    priceUsd: "0.0005415",
    txns: { m5: { buys: 0, sells: 0 }, h1: { buys: 0, sells: 0 }, h6: { buys: 0, sells: 0 }, h24: { buys: 1, sells: 17 } },
    volume: { h24: 1570.55, h6: 0, h1: 0, m5: 0 },
    priceChange: { h24: -6.17 },
    liquidity: { usd: 85824.56, base: 79239284, quote: 60999 },
    fdv: 541331,
    marketCap: 541331,
    pairCreatedAt: 1783873648000,
  },
  {
    chainId: "robinhood",
    dexId: "uniswap",
    url: "https://dexscreener.com/robinhood/0x8a0f44908432b68c0cb36ba7345c1f2cde80cc3f",
    pairAddress: "0x8A0F44908432B68C0cb36BA7345C1F2cDe80Cc3F",
    labels: ["v2"],
    baseToken: { address: "0xA80Ba06F0a0327E68dA6BedE67eB35ac023D6e62", name: "The Floor", symbol: "FLOOR" },
    quoteToken: { address: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73", name: "WETH", symbol: "WETH" },
    priceNative: "0.002022",
    priceUsd: "5.058",
    txns: { m5: { buys: 0, sells: 0 }, h1: { buys: 0, sells: 0 }, h6: { buys: 2, sells: 1 }, h24: { buys: 2, sells: 1 } },
    volume: { h24: 1.98, h6: 1.98, h1: 0, m5: 0 },
    priceChange: { h6: -100, h24: -100 },
    liquidity: { usd: 0, base: 0.00004664, quote: 9.432e-8 },
    fdv: 35944659,
    marketCap: 35944659,
    pairCreatedAt: 1784749201000,
  },
] as const;

const SUPPLY = "1000000000000000000000000000"; // 1e9 tokens at 18 decimals

/** Blockscout v2 `/api/v2/tokens/{address}` bodies, keyed by lower-cased address. Synthetic values. */
export const BLOCKSCOUT_TOKENS: Record<string, Record<string, unknown>> = {
  "0x0cc8522ca4f423638032d0211a6e823392a1eae1": { address_hash: "0x0cc8522ca4F423638032d0211a6E823392A1eAe1", name: "PLAYGROUND", symbol: "PBUX", decimals: "18", total_supply: SUPPLY, holders_count: "1840", exchange_rate: null, type: "ERC-20" },
  "0xe44951407d2ed8e73dce4b7002908732bc0d0bc3": { address_hash: "0xE44951407D2ed8E73dce4b7002908732BC0d0bC3", name: "Kindra by Virtuals", symbol: "KINDRA", decimals: "18", total_supply: SUPPLY, holders_count: "536", exchange_rate: null, type: "ERC-20" },
  "0x64abfc878dc340bbf33bae4aaf39ed33fb1828c0": { address_hash: "0x64abfc878dc340bbf33bae4aaf39ed33fb1828c0", name: "Yorozu", symbol: "YORO", decimals: "18", total_supply: SUPPLY, holders_count: "212", exchange_rate: null, type: "ERC-20" },
  "0xa80ba06f0a0327e68da6bede67eb35ac023d6e62": { address_hash: "0xA80Ba06F0a0327E68dA6BedE67eB35ac023D6e62", name: "The Floor", symbol: "FLOOR", decimals: "18", total_supply: SUPPLY, holders_count: "663", exchange_rate: null, type: "ERC-20" },
};

/** Top-ten share of supply per token for the holders fixture. */
const TOP10_SHARE: Record<string, number> = {
  "0x0cc8522ca4f423638032d0211a6e823392a1eae1": 0.42,
  "0xe44951407d2ed8e73dce4b7002908732bc0d0bc3": 0.3,
  "0x64abfc878dc340bbf33bae4aaf39ed33fb1828c0": 0.64,
  "0xa80ba06f0a0327e68da6bede67eb35ac023d6e62": 0.81,
};

/** Blockscout v2 `/api/v2/tokens/{address}/holders` body: ten equal holders summing to the fixture share. */
export function blockscoutHolders(address: string): { items: { address: { hash: string }; value: string }[]; next_page_params: null } | null {
  const share = TOP10_SHARE[address.toLowerCase()];
  if (share === undefined) return null;
  const each = (BigInt(SUPPLY) * BigInt(Math.round(share * 10_000))) / 10_000n / 10n;
  const items = Array.from({ length: 10 }, (_, i) => ({ address: { hash: `0x${(i + 1).toString(16).padStart(40, "0")}` }, value: each.toString() }));
  return { items, next_page_params: null };
}

export const BLOCKSCOUT_STATS = {
  average_block_time: 250,
  total_addresses: "1204511",
  total_blocks: "88072189",
  gas_prices: { slow: 0.01, average: 0.01, fast: 0.02 },
  coin_price: "2504.12",
};

/** Blockscout v2 `/api/v2/search?q=senkai`. Name matches only; none of these is attested. */
export const BLOCKSCOUT_SEARCH: Record<string, { items: Record<string, unknown>[]; next_page_params: null }> = {
  senkai: {
    items: [
      { type: "token", address_hash: "0x46cf2cA61505902a4410B3B4242d787cD4737777", name: "Senkai", symbol: "SENKAI", token_type: "ERC-20", is_smart_contract_verified: false },
      { type: "token", address_hash: "0xc4F000301e49ba5f1aC64cC56D5EA026050010C6", name: "SENKAI", symbol: "SENKAI", token_type: "ERC-20", is_smart_contract_verified: true },
      { type: "token", address_hash: "0x5e4a000000000000000000000000000000000003", name: "Senkai Game", symbol: "SENKAI", token_type: "ERC-20", is_smart_contract_verified: false },
      { type: "token", address_hash: "0x5e4a000000000000000000000000000000000004", name: "Senkai Official", symbol: "SNK", token_type: "ERC-20", is_smart_contract_verified: false },
      { type: "token", address_hash: "0x5e4a000000000000000000000000000000000005", name: "senkai", symbol: "SENKAI", token_type: "ERC-20", is_smart_contract_verified: false },
      { type: "token", address_hash: "0x5e4a000000000000000000000000000000000006", name: "Senkai V2", symbol: "SENKAI2", token_type: "ERC-20", is_smart_contract_verified: false },
      { type: "address", address_hash: "0x5e4a000000000000000000000000000000000007", name: "Senkai deployer" },
    ],
    next_page_params: null,
  },
};

/** What the Blockscout instance actually returned to the recording request (trimmed). */
export const BLOCKSCOUT_CHALLENGE_HTML = '<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title></head><body></body></html>';

/** Recorded `eth_blockNumber` result. */
export const RPC_BLOCK_NUMBER = "0x53fdffd";
