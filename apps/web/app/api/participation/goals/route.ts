import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError } from "@/lib/api/response";
import {
  completeParticipationGoal,
  createParticipationGoal,
} from "@/lib/participation/participation-planner-service";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => ({}));

  try {
    if (body.action === "complete") {
      const goal = await completeParticipationGoal({
        goalId: String(body.goalId),
        participantId: user.id,
      });
      return NextResponse.json({ goal });
    }

    const goal = await createParticipationGoal({
      participantId: user.id,
      title: String(body.title),
      notes: body.notes ? String(body.notes) : undefined,
      targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
    });
    return NextResponse.json({ goal }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed";
    if (message === "PARTICIPATION_PLANNER_DISABLED") {
      return jsonError("Participation planner disabled", 403);
    }
    return jsonError(message, 400);
  }
}
