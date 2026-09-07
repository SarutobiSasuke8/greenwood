import type { GameRecord } from "./types.js";

/**
 * The attested registry.
 *
 * Every entry was verified by hand against the project's own site, Robinhood Chain
 * Blockscout and DexScreener. Token addresses are only recorded when two independent
 * sources agree (for example, the address printed in the project's page source and
 * the same contract resolving on Blockscout under that name). Ticker matching is
 * never used to resolve a contract, because this chain carries six Senkai-named and
 * four Thornveil-named ERC-20s.
 *
 * Adding a game: copy an entry, fill the evidence with dates, leave `tokenAddress`
 * null until attestation exists. `pnpm sweep` will tell you what the chain says.
 */
export const REGISTRY: GameRecord[] = [
{
  "id": "robinhood-derby",
  "name": "Robinhood Derby",
  "ticker": "PBUX",
  "genre": "On-chain racing · paid entry",
  "summary": "Playground’s daily browser race on Robinhood Chain. The project reports paid ETH entry and tokenised-stock jackpots; PBUX is the platform token, not a separate Derby token.",
  "website": "https://pbux.io/derby",
  "socials": {
    "x": "https://x.com/playground_pbux",
    "telegram": "https://t.me/playground_pbux"
  },
  "logo": {
    "path": "/images/games/playground.png",
    "sourceUrl": "https://pbux.io/logo.png",
    "checkedAt": "2026-09-07"
  },
  "resources": [
    {
      "label": "Guide",
      "url": "https://pbux.io/docs",
      "sourceUrl": "https://pbux.io/derby",
      "checkedAt": "2026-09-07"
    }
  ],
  "playerInfo": {
    "platform": "browser",
    "entry": "paid",
    "wallet": "required",
    "sourceUrl": "https://pbux.io/docs",
    "checkedAt": "2026-09-07"
  },
  "tokenAddress": "0x0cc8522ca4F423638032d0211a6E823392A1eAe1",
  "pairAddress": null,
  "status": "live",
  "playable": null,
  "tokenGated": false,
  "teamVisibility": 0,
  "tickerCollisions": 0,
  "unattestedContracts": [],
  "discoveredVia": "Project documentation and live race landing page",
  "evidence": [
    {
      "date": "2026-09-07",
      "note": "Project documentation identifies Robinhood Chain 4663, the PBUX platform token address and paid-entry Derby. Public page retrieved successfully; Greenwood has not entered or playtested a race.",
      "url": "https://pbux.io/docs"
    },
    {
      "date": "2026-09-07",
      "note": "Independent DexScreener API returned Robinhood pools with the exact project-published base-token address and PLAYGROUND/PBUX identity. Blockscout retrieval was blocked (403); no explorer verification is claimed.",
      "url": "https://api.dexscreener.com/token-pairs/v1/robinhood/0x0cc8522ca4F423638032d0211a6E823392A1eAe1"
    }
  ],
  "verdict": "An additional racing listing, with a source-checked platform token. Entry involves real stakes. Jackpot, settlement and fairness descriptions are project claims, not a Greenwood audit or proof of payouts.",
  "lastVerified": "2026-09-07"
},
  {
    id: "kindra",
    playerInfo: { platform: "browser", entry: "free", wallet: "optional", sourceUrl: "https://playkindra.com", checkedAt: "2026-09-07" },
    logo: {"path": "/images/games/kindra.png", "sourceUrl": "https://playkindra.com/logo.png?v=3", "checkedAt": "2026-09-07"},
    resources: [{"label": "Game app", "url": "https://app.playkindra.com", "sourceUrl": "https://playkindra.com", "checkedAt": "2026-09-07"}, {"label": "Guide", "url": "https://playkindra.com/docs.html", "sourceUrl": "https://playkindra.com", "checkedAt": "2026-09-07"}],
    name: "Kindra",
    ticker: "KINDRA",
    genre: "Browser 3D skilling MMO",
    summary:
      "A playable browser MMO with skilling, bosses, portal realms and a live marketplace. Launched through the Virtuals Protocol on Robinhood Chain.",
    website: "https://playkindra.com",
    socials: { x: "https://x.com/PlayKindra", telegram: "https://t.me/playkindra", discord: "https://discord.gg/playkindra" },
    tokenAddress: "0xE44951407D2ed8E73dce4b7002908732BC0d0bC3",
    pairAddress: "0x596A9A9a9B9bD56b47b93949c3f6A823C5629200",
    status: "live",
    playable: true,
    tokenGated: false,
    teamVisibility: 1,
    tickerCollisions: 0,
    unattestedContracts: [],
    discoveredVia: "PLAYHOOD, then verified on the official site",
    evidence: [
      { date: "2026-09-07", note: "Project page publishes 0xE44951407D2ed8E73dce4b7002908732BC0d0bC3; independent explorer metadata was checked during the same-day sweep. This is identity evidence, not a new playtest.", url: "https://playkindra.com" },
      { date: "2026-09-07", note: "Independent explorer reference for the project-published address.", url: "https://robinhoodchain.blockscout.com/token/0xE44951407D2ed8E73dce4b7002908732BC0d0bC3" },
      { date: "2026-09-01", note: "Official site live with a fully functional browser 3D MMO: documented regions, bosses, multiplayer world, marketplace." },
      { date: "2026-09-06", note: "Token 0xE449…0bC3 confirmed on Blockscout as KINDRA (Kindra by Virtuals), 536 holders. DexScreener Uniswap v2 pair against VIRTUAL resolves live, roughly 53K USD liquidity.", url: "https://robinhoodchain.blockscout.com/token/0xE44951407D2ed8E73dce4b7002908732BC0d0bC3" },
    ],
    verdict:
      "An earlier manual check recorded a playable browser build. The project has published token and entry information. Review the current market and concentration observations separately from gameplay.",
    lastVerified: "2026-09-06",
  },
  {
    id: "yorozu",
    logo: {"path": "/images/games/yorozu.png", "sourceUrl": "https://www.yorozu.gg/apple-touch-icon.png?v=7", "checkedAt": "2026-09-07"},
    resources: [{"label": "Game app", "url": "https://play.yorozu.gg", "sourceUrl": "https://www.yorozu.gg", "checkedAt": "2026-09-07"}, {"label": "Guide", "url": "https://www.yorozu.gg/guide", "sourceUrl": "https://www.yorozu.gg", "checkedAt": "2026-09-07"}],
    name: "Yorozu",
    ticker: "YORO",
    genre: "AI-generated MMO",
    summary: "AI-generated worlds with raids and an in-page codex. The project links to a game app; playability has not been checked by Greenwood.",
    website: "https://www.yorozu.gg",
    socials: {},
    tokenAddress: "0x64abfc878dc340bbf33bae4aaf39ed33fb1828c0",
    pairAddress: null,
    status: "live",
    playable: null,
    tokenGated: false,
    teamVisibility: 0,
    tickerCollisions: 0,
    unattestedContracts: [],
    discoveredVia: "PLAYHOOD",
    evidence: [
      { date: "2026-09-07", note: "Project page publishes 0x64abfc878dc340bbf33bae4aaf39ed33fb1828c0; independent explorer metadata was checked during the same-day sweep. This is identity evidence, not a new playtest.", url: "https://www.yorozu.gg" },
      { date: "2026-09-07", note: "Independent explorer reference for the project-published address.", url: "https://robinhoodchain.blockscout.com/token/0x64abfc878dc340bbf33bae4aaf39ed33fb1828c0" },
      { date: "2026-09-06", note: "Contract 0x64ab…28c0 extracted from the official page source and confirmed on Blockscout as YORO, 616 holders." },
      { date: "2026-09-06", note: "DexScreener returns no pairs for the token. The pair PLAYHOOD wires returns null, so its displayed 0.0007563 USD price is a hardcoded fallback." },
      { date: "2026-09-06", note: "Site live with a Play Now call to action. Retrieval alone does not prove the game is playable, so `playable` stays unestablished." },
    ],
    verdict: "The earlier no-pool observation is historical. A pool was returned on 2026-09-07; use the current market panel and source state. Gameplay remains unverified.",
    lastVerified: "2026-09-06",
  },
  {
    id: "the-floor",
    logo: {"path": "/images/games/the-floor.png", "sourceUrl": "https://thefloor.sh/branding/the-floor-mark-512.png", "checkedAt": "2026-09-07"},
    resources: [{"label": "Game app", "url": "https://thefloor.sh/app", "sourceUrl": "https://thefloor.sh", "checkedAt": "2026-09-07"}, {"label": "Docs", "url": "https://thefloor.sh/docs", "sourceUrl": "https://thefloor.sh", "checkedAt": "2026-09-07"}, {"label": "Leaderboard", "url": "https://thefloor.sh/league-table", "sourceUrl": "https://thefloor.sh", "checkedAt": "2026-09-07"}],
    name: "The Floor",
    ticker: "FLOOR",
    genre: "Onchain Wall Street strategy",
    summary: "Take a desk, seat Operators, collect FLOOR, ring the Bell, ranked weekly. A live project website; assess the current pool observation separately.",
    website: "https://thefloor.sh",
    socials: { x: "https://x.com/robinhoodfloor", telegram: "https://t.me/robinhoodfloor" },
    tokenAddress: "0xA80Ba06F0a0327E68dA6BedE67eB35ac023D6e62",
    pairAddress: "0x8A0F44908432B68C0cb36BA7345C1F2cDe80Cc3F",
    status: "live",
    playable: null,
    tokenGated: false,
    teamVisibility: 0,
    tickerCollisions: 0,
    unattestedContracts: [],
    discoveredVia: "PLAYHOOD",
    evidence: [
      { date: "2026-09-07", note: "Project page publishes 0xA80Ba06F0a0327E68dA6BedE67eB35ac023D6e62; independent explorer metadata was checked during the same-day sweep. This is identity evidence, not a new playtest.", url: "https://thefloor.sh" },
      { date: "2026-09-07", note: "Independent explorer reference for the project-published address.", url: "https://robinhoodchain.blockscout.com/token/0xA80Ba06F0a0327E68dA6BedE67eB35ac023D6e62" },
      { date: "2026-09-06", note: "Contract 0xA80B…6e62 from the official page source, confirmed on Blockscout as FLOOR, 663 holders, supply 6,731,032." },
      { date: "2026-09-06", note: "Uniswap pair created 2026-07-22 shows liquidity 0 USD, price 5.095e-19 USD, 24h change -100%. The pool is drained." },
      { date: "2026-09-06", note: "PLAYHOOD displays this listing at 0.1102 USD with 1,085 traders. Its wired pair returns null; the figure is hardcoded HTML roughly eighteen orders of magnitude from the market." },
    ],
    verdict: "On 2026-09-07 the observed pool had less than $1 liquidity, so its headline quote was unusable. This does not establish a migration, relaunch or exit. Gameplay remains unverified.",
    lastVerified: "2026-09-06",
  },
  {
    id: "robin-world",
    name: "Robin World",
    ticker: "Robin",
    genre: "Action-adventure",
    summary: "The recorded website returned a deployment-not-found response. Token observations do not establish whether a game is available elsewhere.",
    website: "https://www.robinworld.gg",
    socials: { x: "https://x.com/robinworldgg", telegram: "https://t.me/robinworldgg" },
    tokenAddress: null,
    pairAddress: null,
    status: "dormant",
    playable: false,
    tokenGated: false,
    teamVisibility: 0,
    tickerCollisions: 2,
    unattestedContracts: ["0xc9539c33b6940807a49e0d8610D17521B64f7777"],
    discoveredVia: "PLAYHOOD",
    evidence: [
      { date: "2026-09-07", note: "Previously associated token moved to candidates: the recorded evidence lacks a retrievable project-origin address publication. Historical DEX observations remain below; no current quote is assigned until attestation is restored." },
      { date: "2026-09-06", note: "DexScreener resolves a live Uniswap pair quoted in WETH, created 2026-07-12, roughly 6.9K USD liquidity and 5 USD 24h volume." },
      { date: "2026-09-06", note: "Official site returns DEPLOYMENT_NOT_FOUND. Nothing to play." },
      { date: "2026-09-06", note: "Shares the ROBIN ticker with two unrelated projects, Robin In The Hood and Robin Hood AFK-Game." },
    ],
    verdict: "The recorded website was unavailable at the last check. No current playable build has been verified.",
    lastVerified: "2026-09-06",
  },
  {
    id: "senkai",
    name: "Senkai",
    ticker: "SENKAI",
    genre: "Onchain MMO",
    summary: "No DNS record for the official domain, and at least six Senkai-named contracts on chain with no attestation.",
    website: "https://www.playsenkai.com",
    socials: {},
    tokenAddress: null,
    pairAddress: null,
    status: "dormant",
    playable: false,
    tokenGated: false,
    teamVisibility: 0,
    tickerCollisions: 5,
    unattestedContracts: ["0x46cf2cA61505902a4410B3B4242d787cD4737777", "0xc4F000301e49ba5f1aC64cC56D5EA026050010C6"],
    discoveredVia: "PLAYHOOD",
    evidence: [
      { date: "2026-09-06", note: "playsenkai.com has no DNS A record." },
      { date: "2026-09-06", note: "Blockscout search returns six or more Senkai-named ERC-20s. None can be tied to this project. The pair PLAYHOOD wires returns null." },
    ],
    verdict: "Dormant, with a ticker that has been squatted several times over. Any Senkai price you see is for a contract nobody has attested.",
    lastVerified: "2026-09-06",
  },
  {
    id: "sherwood-online",
    name: "Sherwood Online",
    ticker: "SHERWOOD",
    genre: "Medieval MMORPG",
    summary: "Craft, hunt, raid instanced realms. Required holding SHERWOOD to play. Domain now fails to resolve.",
    website: "https://sherwoodonline.xyz",
    socials: {},
    tokenAddress: null,
    pairAddress: null,
    status: "dormant",
    playable: false,
    tokenGated: true,
    teamVisibility: 0,
    tickerCollisions: 3,
    unattestedContracts: ["0xD4DC6B48Ad73EC51E71D9B8F65568f88609b92c1"],
    discoveredVia: "PLAYHOOD",
    evidence: [
      { date: "2026-09-06", note: "sherwoodonline.xyz returns SERVFAIL." },
      { date: "2026-09-06", note: "Four or more Sherwood-named contracts on chain (Protocol WOOD, Exchange SWOOD, Shark SHERK). A Sherwood/SHERWOOD candidate exists at 0xD4DC6B48Ad73EC51E71D9B8F65568f88609b92c1 but is not written as attested: the project's site is down, so nothing can confirm it." },
    ],
    verdict: "Earlier evidence describes token-gated entry. The recorded domain could not be reached; current gameplay and contract ownership remain unverified.",
    lastVerified: "2026-09-06",
  },
  {
    id: "robin-in-the-hood",
    name: "Robin In The Hood",
    ticker: "ROBIN",
    genre: "Heist / action",
    summary: "Trailer, roadmap, token. Host now returns Application not found.",
    website: "https://robinthehood.world",
    socials: {},
    tokenAddress: null,
    pairAddress: null,
    status: "dormant",
    playable: false,
    tokenGated: false,
    teamVisibility: 0,
    tickerCollisions: 2,
    unattestedContracts: [],
    discoveredVia: "PLAYHOOD",
    evidence: [
      { date: "2026-09-06", note: "robinthehood.world returns HTTP 404 Application not found at the host level." },
      { date: "2026-09-06", note: "One of three unrelated projects trading as ROBIN." },
    ],
    verdict: "Nothing playable was ever observed. Ticker collision makes any ROBIN quote ambiguous by construction.",
    lastVerified: "2026-09-06",
  },
  {
    id: "robin-hood-afk-game",
    name: "Robin Hood AFK-Game",
    ticker: "ROBIN",
    genre: "Idle / AFK",
    summary: "An idle-game skin on a .fun domain that no longer resolves.",
    website: "https://robinhoodafkgame.fun",
    socials: {},
    tokenAddress: null,
    pairAddress: null,
    status: "dormant",
    playable: false,
    tokenGated: false,
    teamVisibility: 0,
    tickerCollisions: 2,
    unattestedContracts: [],
    discoveredVia: "PLAYHOOD",
    evidence: [
      { date: "2026-09-06", note: "robinhoodafkgame.fun returns SERVFAIL." },
      { date: "2026-09-06", note: "Third project on the ROBIN ticker." },
    ],
    verdict: "Recorded domain unavailable at the last check. ROBIN is shared by unrelated projects; do not assign a quote by ticker.",
    lastVerified: "2026-09-06",
  },
  {
    id: "thornveil",
    name: "Thornveil",
    ticker: "THORNVEIL",
    genre: "Unannounced",
    summary: "Announced on X only. No site, no launch, and already four Thornveil-named contracts on chain.",
    website: null,
    socials: { x: "https://x.com/thornveilfun" },
    tokenAddress: null,
    pairAddress: null,
    status: "pre-launch",
    playable: false,
    tokenGated: false,
    teamVisibility: 0,
    tickerCollisions: 4,
    unattestedContracts: [
      "0xC2CF3c1ab4D585dbd6f21c8C949dDBe74614BC7C",
      "0xe8b7dFB18aaA39882AC7C3A05d096524D054AB3C",
      "0x9A59b3A12771A1e5A302C12C92c2068EF7fF56Df",
      "0x992DE535fEf134612e7c3AEFAfbd6F0a9cca2f3b",
    ],
    discoveredVia: "PLAYHOOD",
    evidence: [
      { date: "2026-09-06", note: "Four distinct Thornveil-named ERC-20s exist on chain, one under the Virtuals naming convention. None is attested by the project." },
    ],
    verdict: "Listed so a launch is observed rather than discovered late. Unscreenable until something ships.",
    lastVerified: "2026-09-06",
  },
];

export function getRecord(id: string): GameRecord | undefined {
  return REGISTRY.find((g) => g.id === id);
}

export function listRecords(): GameRecord[] {
  return [...REGISTRY];
}
