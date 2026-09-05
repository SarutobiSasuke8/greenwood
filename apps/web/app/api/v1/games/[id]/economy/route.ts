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
  const { id } = await ctx.params;
  const expected = process.env.GREENWOOD_INGEST_TOKEN?.trim();
  if (!expected) return problem(503, "Ingest disabled", "GREENWOOD_INGEST_TOKEN is not configured on this server.");
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) return problem(401, "Unauthorised", "A valid bearer token is required.");
  if (!getRecord(id)) return problem(404, "Unknown game", `No registry entry with id "${id}".`);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Invalid JSON");
  }
  try {
    const saved = await appendEconomyReport(id, body);
    return json({ saved }, { status: 201, maxAge: 0 });
  } catch (err) {
    return problem(422, "Report rejected", err instanceof Error ? err.message : String(err));
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204 });
}
