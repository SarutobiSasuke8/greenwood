import { tickerCollisions } from "@greenwood/core";
import { json } from "@/lib/api";

export function GET() {
  return json({ collisions: tickerCollisions() }, { maxAge: 3600 });
}
