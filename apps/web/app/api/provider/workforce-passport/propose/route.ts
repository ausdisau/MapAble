import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  proposeCompetencyFromAcademy,
  proposeCompetencyFromTrainingCompletion,
} from "@/lib/careos/opportunities/workforce-passport-adapter";
import {
  assertProviderOrgAccess,
  loadWorkerOrThrow,
} from "@/lib/workforce/access";
import { handleCapabilityError } from "@/lib/workforce/http";

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
    const worker = await loadWorkerOrThrow(body.workerProfileId);
    if (worker.userId !== user.id) {
      await assertProviderOrgAccess(user, worker);
    }
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
    return handleCapabilityError(error);
  }
}
