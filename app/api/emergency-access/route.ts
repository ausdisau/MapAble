import { z } from "zod";

import { requireApiAdmin, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  listEmergencyAccessRequests,
  requestEmergencyAccess,
  reviewEmergencyAccess,
} from "@/lib/authority/emergency-access-service";

const requestSchema = z.object({
  participantId: z.string().optional(),
  purpose: z.string().min(1).max(500),
  justification: z.string().min(20).max(5000),
  requestedScopes: z.array(z.string().min(1)).min(1),
  expiresAt: z.string().datetime().optional(),
});

const reviewSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(["approve", "deny"]),
  notes: z.string().max(2000).optional(),
  approvedExpiresAt: z.string().datetime().optional(),
});

export async function GET() {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  const requests = await listEmergencyAccessRequests(actor.id);
  return jsonOk({ requests });
}

export async function POST(request: Request) {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const emergencyRequest = await requestEmergencyAccess({
      participantId: parsed.data.participantId ?? actor.id,
      requesterId: actor.id,
      purpose: parsed.data.purpose,
      justification: parsed.data.justification,
      requestedScopes: parsed.data.requestedScopes,
      expiresAt: parsed.data.expiresAt
        ? new Date(parsed.data.expiresAt)
        : undefined,
    });
    return jsonOk({ request: emergencyRequest }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    if (message === "EMERGENCY_ACCESS_DISABLED") {
      return jsonError("Emergency access is not enabled", 404);
    }
    if (message === "EMERGENCY_JUSTIFICATION_REQUIRED") {
      return jsonError("A detailed justification is required", 400);
    }
    return jsonError(message, 400);
  }
}

export async function PATCH(request: Request) {
  const reviewer = await requireApiAdmin();
  if (reviewer instanceof Response) return reviewer;

  const parsed = reviewSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await reviewEmergencyAccess({
      requestId: parsed.data.requestId,
      reviewerId: reviewer.id,
      reviewerRole: reviewer.primaryRole,
      decision: parsed.data.decision,
      notes: parsed.data.notes,
      approvedExpiresAt: parsed.data.approvedExpiresAt
        ? new Date(parsed.data.approvedExpiresAt)
        : undefined,
    });
    return jsonOk(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review failed";
    if (message === "EMERGENCY_ACCESS_DISABLED") {
      return jsonError("Emergency access is not enabled", 404);
    }
    if (message === "EMERGENCY_REVIEW_REQUIRES_HUMAN_ADMIN") {
      return jsonError("Human admin review is required", 403);
    }
    if (message === "EMERGENCY_ACCESS_NOT_FOUND") {
      return jsonError("Request not found", 404);
    }
    if (message === "EMERGENCY_ACCESS_NOT_REVIEWABLE") {
      return jsonError("Request is not in a reviewable state", 409);
    }
    return jsonError(message, 400);
  }
}
