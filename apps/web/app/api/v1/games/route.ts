import type { NextRequest } from "next/server";
import { getSnapshots } from "@/lib/data";
import { json } from "@/lib/api";

export const revalidate = 300;

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const status = url.searchParams.get("status");
  const minScreen = url.searchParams.get("minScreen");
  const sort = url.searchParams.get("sort") ?? "screen";

  let games = await getSnapshots();
  if (status) games = games.filter((g) => g.record.status === status);
  if (minScreen) games = games.filter((g) => (g.screen.total ?? -1) >= Number(minScreen));

  const num = (v: number | null | undefined) => (v === null || v === undefined ? -Infinity : v);
  games = [...games].sort((a, b) => {
    switch (sort) {
      case "liquidity":
        return num(b.market?.liquidityUsd) - num(a.market?.liquidityUsd);
      case "holders":
        return num(b.token?.holders) - num(a.token?.holders);
      case "change":
        return num(b.market?.priceChange24h) - num(a.market?.priceChange24h);
      default:
        return num(b.screen.total) - num(a.screen.total);
    }
  });

  return json({ chainId: 4663, count: games.length, games });
}
