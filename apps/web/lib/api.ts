import { NextResponse } from "next/server";

export function json(data: unknown, init: { status?: number; maxAge?: number } = {}) {
  const { status = 200, maxAge = 300 } = init;
  return NextResponse.json(
    { generatedAt: new Date().toISOString(), ...(data as object) },
    {
      status,
      headers: {
        "Cache-Control": maxAge > 0 ? `public, s-maxage=${maxAge}, stale-while-revalidate=${Math.floor(maxAge / 2)}` : "no-store",
      },
    },
  );
}

export function problem(status: number, title: string, detail?: string) {
  return NextResponse.json({ type: "about:blank", title, status, detail }, { status, headers: { "Content-Type": "application/problem+json", "Cache-Control": "no-store" } });
}
