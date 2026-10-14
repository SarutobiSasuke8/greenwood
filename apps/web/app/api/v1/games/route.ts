import type { NextRequest } from "next/server";
import { rankGames } from "@greenwood/core";
import { getSnapshots } from "@/lib/data";
import { json } from "@/lib/api";

export const revalidate = 300;

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const minScreen = url.searchParams.get("minScreen");
  const games = rankGames(await getSnapshots(), {
    status: url.searchParams.get("status"),
    minScreen: minScreen ? Number(minScreen) : undefined,
    sort: url.searchParams.get("sort"),
  });
  return json({ chainId: 4663, count: games.length, games });
}
