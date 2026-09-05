import { getChain } from "@/lib/data";
import { json } from "@/lib/api";

export const revalidate = 60;

export async function GET() {
  const chain = await getChain();
  return json(chain, { maxAge: 60 });
}
