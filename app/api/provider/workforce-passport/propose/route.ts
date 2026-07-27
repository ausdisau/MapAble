import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  proposeCompetencyFromAcademy,
  proposeCompetencyFromTrainingCompletion,
} from "@/lib/careos/opportunities/workforce-passport-adapter";

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = (await request.json()) as {
    workerProfileId?: string;
    competencyType?: string;
    courseId?: string;
    trainingCompletionId?: string;
  };

  if (!body.workerProfileId || !body.competencyType) {
    return NextResponse.json({ error: "INVALID_PROPOSAL" }, { status: 400 });
  }

  try {
    if (body.trainingCompletionId) {
      const result = await proposeCompetencyFromTrainingCompletion({
        workerProfileId: body.workerProfileId,
        trainingCompletionId: body.trainingCompletionId,
        competencyType: body.competencyType,
        proposedByUserId: user.id,
      });
      return NextResponse.json(result, { status: 201 });
    }
    if (!body.courseId) {
      return NextResponse.json({ error: "COURSE_OR_COMPLETION_REQUIRED" }, { status: 400 });
    }
    const result = await proposeCompetencyFromAcademy({
      workerProfileId: body.workerProfileId,
      courseId: body.courseId,
      competencyType: body.competencyType,
      proposedByUserId: user.id,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PROPOSE_FAILED";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
