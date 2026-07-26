import { NextResponse } from "next/server";

import {
  accessIntelligenceNextFlags,
  executeAccessQuery,
  type AccessQueryAst,
  type ParticipantRequirementSet,
} from "@/lib/access/intelligence-next";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (
    !accessIntelligenceNextFlags.enabled ||
    !accessIntelligenceNextFlags.queryLanguage
  ) {
    return NextResponse.json(
      { error: "Access Query Language execution is disabled" },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = body as {
    query?: AccessQueryAst;
    requirementSet?: ParticipantRequirementSet;
  };
  if (!parsed.query || typeof parsed.query !== "object") {
    return NextResponse.json({ error: "Body must include query object" }, { status: 400 });
  }

  const execution = executeAccessQuery({
    query: parsed.query,
    requirementSet: parsed.requirementSet,
  });

  return NextResponse.json({
    mode: accessIntelligenceNextFlags.mode,
    synthetic: true,
    productionClaim: "none",
    ...execution,
  });
}
