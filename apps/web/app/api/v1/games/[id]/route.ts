import { getSnapshot } from "@/lib/data";
import { json, problem } from "@/lib/api";

export const revalidate = 300;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const game = await getSnapshot(id);
  if (!game) return problem(404, "Unknown game", `No registry entry with id "${id}".`);
  return json({ game });
}
