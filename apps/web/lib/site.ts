export const SITE = {
  name: "Greenwood",
  tagline: "A game index for Robinhood Chain that ranks the build before it prices the token.",
  description:
    "Greenwood screens every game on Robinhood Chain for a playable build, a visible team, real liquidity, holder spread and ticker clarity, using live chain data. Public API and MCP server included.",
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3210",
  github: "https://github.com/SarutobiSasuke8/greenwood",
  x: "https://x.com/Sarut0biSasuke",
  chainId: 4663,
  refreshSeconds: 300,
};

export const NAV = [
  { href: "/", label: "Index" },
  { href: "/method", label: "Method" },
  { href: "/developers", label: "API" },
  { href: "/mcp", label: "MCP" },
  { href: "/about", label: "About" },
] as const;

export const FOOTER_GROUPS = [
  {
    label: "Explore",
    links: [
      { href: "/", label: "Game index" },
      { href: "/method", label: "How the screen works" },
      { href: "/about#collisions", label: "Ticker collisions" },
      { href: "/about", label: "About Greenwood" },
    ],
  },
  {
    label: "Developers",
    links: [
      { href: "/developers", label: "REST API" },
      { href: "/api/v1/openapi.json", label: "OpenAPI 3.1" },
      { href: "/mcp", label: "MCP server" },
      { href: "/developers#economy", label: "Economy ingest contract" },
      { href: SITE.github, label: "Source on GitHub" },
    ],
  },
] as const;
