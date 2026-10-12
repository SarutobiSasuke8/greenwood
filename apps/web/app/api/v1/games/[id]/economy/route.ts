import { appendEconomyReport, getRecord, listEconomyReports, sinkFaucetRatio } from "@greenwood/core";
import { getSnapshot } from "@/lib/data";
import { json, problem } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const record = getRecord(id);
  if (!record) return problem(404, "Unknown game", `No registry entry with id "${id}".`);
  const [snap, reports] = await Promise.all([getSnapshot(id), listEconomyReports(id)]);
  return json(
    {
      game: { id: record.id, name: record.name, ticker: record.ticker, tokenAddress: record.tokenAddress },
      onchain: { market: snap?.market ?? null, token: snap?.token ?? null, sources: snap?.sources ?? null, fetchedAt: snap?.fetchedAt ?? null },
      reported: { count: reports.length, latest: reports.at(-1) ?? null, sinkFaucetRatio: sinkFaucetRatio(reports), reports: reports.slice(-90) },
    },
    { maxAge: 60 },
  );
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return problem(503, "Ingest disabled", "Studio reporting is read-only pending scoped credentials and transactional storage.");
}

export function OPTIONS() {
  return new Response(null, { status: 204 });
}
