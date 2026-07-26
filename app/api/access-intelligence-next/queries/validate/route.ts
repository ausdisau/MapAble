import { NextResponse } from "next/server";

import {
  accessIntelligenceNextFlags,
  validateAccessQuery,
  type AccessQueryAst,
} from "@/lib/access/intelligence-next";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (
    !accessIntelligenceNextFlags.enabled ||
    !accessIntelligenceNextFlags.queryLanguage
  ) {
    return NextResponse.json(
      { error: "Access Query Language is disabled" },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = (body as { query?: AccessQueryAst }).query;
  if (!query || typeof query !== "object") {
    return NextResponse.json({ error: "Body must include query object" }, { status: 400 });
  }

  const result = validateAccessQuery(query);
  return NextResponse.json({
    mode: accessIntelligenceNextFlags.mode,
    synthetic: true,
    ...result,
  });
}
