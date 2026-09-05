import { getChain } from "@/lib/data";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const chain = await getChain().catch(() => null);
  const ok = chain?.rpc.state === "ok";
  return json(
    {
      status: ok ? "ok" : "degraded",
      providers: {
        rpc: chain?.rpc ?? { state: "error", fetchedAt: null, detail: "chain status unavailable" },
        blockscout: chain?.blockscout ?? { state: "error", fetchedAt: null },
      },
      ingestEnabled: Boolean(process.env.GREENWOOD_INGEST_TOKEN?.trim()),
      version: "0.2.0",
    },
    { status: ok ? 200 : 503, maxAge: 0 },
  );
}
