import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  correctParticipantApplication,
  getParticipantApplication,
  requestInterviewAdjustment,
  submitParticipantApplication,
} from "@/lib/jobs/applications/participant-application-service";

const correctSchema = z.object({
  applicantSummary: z.string().optional(),
  coverLetter: z.string().optional(),
  reasonableAdjustmentRequest: z.string().optional(),
  shareAdjustments: z.boolean().optional(),
  shareAdjustmentsConfirmed: z.boolean().optional(),
  transportSupportNeeded: z.boolean().optional(),
  careSupportNeeded: z.boolean().optional(),
  resumeDocumentId: z.string().optional(),
});

const adjustmentSchema = z.object({
  details: z.string().min(1),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { applicationId } = await params;
  try {
    return jsonOk({
      application: await getParticipantApplication(applicationId, user.id),
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "APPLICATION_NOT_FOUND") {
        return jsonError("Application not found", 404);
      }
      if (e.message === "JOBS_PARTICIPATION_DISABLED") {
        return jsonError("Jobs participation is unavailable", 503);
      }
    }
    return jsonError("Failed to load application", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { applicationId } = await params;
  const parsed = correctSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    return jsonOk({
      application: await correctParticipantApplication({
        applicationId,
        participantId: user.id,
        ...parsed.data,
      }),
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "APPLICATION_NOT_FOUND") {
        return jsonError("Application not found", 404);
      }
      if (e.message === "APPLICATION_NOT_EDITABLE") {
        return jsonError("Application cannot be edited", 409);
      }
      if (e.message === "ADJUSTMENT_CONFIRMATION_REQUIRED") {
        return jsonError("Adjustment sharing confirmation required", 400);
      }
    }
    return jsonError("Failed to update application", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { applicationId } = await params;
  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "submit";

  try {
    if (action === "submit") {
      return jsonOk({
        application: await submitParticipantApplication(applicationId, user.id),
      });
    }
    if (action === "request_interview_adjustment") {
      const parsed = adjustmentSchema.safeParse(body);
      if (!parsed.success) return zodErrorResponse(parsed.error);
      const requestRecord = await requestInterviewAdjustment({
        applicationId,
        participantId: user.id,
        details: parsed.data.details,
      });
      return jsonOk({ interviewAdjustmentRequest: requestRecord });
    }
    return jsonError("Unknown action", 400);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "DISCLOSURE_PREVIEW_NOT_CONFIRMED") {
        return jsonError("Confirm disclosure preview before submitting", 400);
      }
      if (e.message === "APPLICATION_NOT_FOUND") {
        return jsonError("Application not found", 404);
      }
    }
    return jsonError("Action failed", 500);
  }
}
