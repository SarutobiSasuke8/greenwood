import { listRecords } from "@greenwood/core";
import { json } from "@/lib/api";

export function GET() {
  return json({ count: listRecords().length, registry: listRecords() }, { maxAge: 3600 });
}
