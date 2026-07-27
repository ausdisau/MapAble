import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  createLifespanLiaisonBrief,
  listLifespanLiaisonBriefs,
} from "@/lib/careos/opportunities/lifespan-liaison";
import type { SchemeKey } from "@/lib/careos/opportunities/scheme-coordination";

export async function GET(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const participantId =
    new URL(request.url).searchParams.get("participantId") ?? user.id;
  try {
    const briefs = await listLifespanLiaisonBriefs(participantId);
    return NextResponse.json({ briefs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "LIST_FAILED";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = (await request.json()) as {
    participantId?: string;
    missionId?: string;
    schemeFrom?: SchemeKey;
    schemeTo?: SchemeKey;
    summary?: string;
    tenantId?: string;
    authorityDecisionId?: string;
  };

  if (
    !body.participantId ||
    !body.schemeFrom ||
    !body.schemeTo ||
    !body.summary
  ) {
    return NextResponse.json({ error: "INVALID_BRIEF" }, { status: 400 });
  }

  try {
    const result = await createLifespanLiaisonBrief({
      participantId: body.participantId,
      missionId: body.missionId,
      schemeFrom: body.schemeFrom,
      schemeTo: body.schemeTo,
      summary: body.summary,
      createdById: user.id,
      tenantId: body.tenantId,
      authorityDecisionId: body.authorityDecisionId,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CREATE_FAILED";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
