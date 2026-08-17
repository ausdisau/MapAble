import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  buildSchemeNavigationBrief,
  tagMissionSchemes,
  type SchemeKey,
} from "@/lib/careos/opportunities/scheme-coordination";

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = (await request.json()) as {
    action?: "brief" | "tag_mission";
    from?: SchemeKey;
    to?: SchemeKey;
    notes?: string;
    missionId?: string;
    participantId?: string;
    schemeKeys?: SchemeKey[];
    includeYpiracCaution?: boolean;
  };

  try {
    if (body.action === "tag_mission") {
      if (!body.missionId || !body.participantId || !body.schemeKeys?.length) {
        return NextResponse.json({ error: "TAG_INVALID" }, { status: 400 });
      }
      const result = await tagMissionSchemes({
        missionId: body.missionId,
        participantId: body.participantId,
        schemeKeys: body.schemeKeys,
        actorUserId: user.id,
        includeYpiracCaution: body.includeYpiracCaution,
      });
      return NextResponse.json(result);
    }

    if (!body.from || !body.to) {
      return NextResponse.json({ error: "BRIEF_INVALID" }, { status: 400 });
    }
    return NextResponse.json(
      buildSchemeNavigationBrief({
        from: body.from,
        to: body.to,
        notes: body.notes,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "SCHEME_ERROR";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
