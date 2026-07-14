import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createParticipantApplication,
  listParticipantApplications,
} from "@/lib/jobs/applications/participant-application-service";
import { createJobApplicationSchema } from "@/lib/validation/jobs";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    return jsonOk({ applications: await listParticipantApplications(user.id) });
  } catch (e) {
    if (e instanceof Error && e.message === "JOBS_PARTICIPATION_DISABLED") {
      return jsonError("Jobs participation is unavailable", 503);
    }
    return jsonError("Failed to load applications", 500);
  }
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const parsed = createJobApplicationSchema.parse(await request.json());
    return jsonOk(
      {
        application: await createParticipantApplication({
          ...parsed,
          participantId: user.id,
        }),
      },
      201,
    );
  } catch (e) {
    if (e instanceof z.ZodError) return zodErrorResponse(e);
    if (e instanceof Error) {
      if (e.message === "JOBS_PARTICIPATION_DISABLED") {
        return jsonError("Jobs participation is unavailable", 503);
      }
      if (e.message === "JOB_NOT_AVAILABLE") {
        return jsonError("Job is not available", 404);
      }
      if (e.message === "ADJUSTMENT_CONFIRMATION_REQUIRED") {
        return jsonError("Adjustment sharing confirmation required", 400);
      }
    }
    return jsonError("Failed to create application", 500);
  }
}
