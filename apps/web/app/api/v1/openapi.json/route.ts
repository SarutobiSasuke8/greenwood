import { NextResponse } from "next/server";
import { buildOpenApi } from "@/lib/openapi";
import { SITE } from "@/lib/site";

export function GET() {
  return NextResponse.json(buildOpenApi(SITE.url), { headers: { "Cache-Control": "public, s-maxage=3600" } });
}
