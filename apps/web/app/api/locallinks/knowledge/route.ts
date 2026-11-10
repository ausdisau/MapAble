import { NextResponse } from "next/server";
import { normalisePublicQuery, searchPublicDisapedia } from "@/lib/locallinks/public-knowledge-bridge";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = normalisePublicQuery(new URL(request.url).searchParams.get("q"));
  if (query.length < 2) {
    return NextResponse.json(
      { source: "disapedia", status: "invalid-query", results: [] },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  const result = await searchPublicDisapedia(query);
  const status = result.status === "ok" ? 200 : result.status === "disabled" ? 503 : 502;
  return NextResponse.json(result, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
