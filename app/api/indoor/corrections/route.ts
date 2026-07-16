import { requireApiSession } from "@/lib/api/auth-handler";
import { isIndoorFeatureEnabled } from "@/lib/indoor-accessibility/feature-flags";
import { featureDisabledResponse, indoorApiError } from "@/lib/indoor-accessibility/api-errors";
import {
  canModerateCorrection,
  canSubmitCorrection,
} from "@/lib/indoor-accessibility/permissions";
import {
  createCorrectionProposal,
  listPendingCorrections,
  moderateCorrectionProposal,
} from "@/lib/indoor-accessibility/verification/correction-service";
import { correctionTypeSchema } from "@/lib/indoor-accessibility/schemas/core";
import { z } from "zod";

const submitSchema = z.object({
  placeId: z.string(),
  floorPlanId: z.string().optional(),
  featureId: z.string().optional(),
  correctionType: correctionTypeSchema,
  description: z.string().min(10).max(2000),
  proposedChanges: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: Request) {
  if (!isIndoorFeatureEnabled("floorPlanCommunityCorrections")) {
    return featureDisabledResponse("floorPlanCommunityCorrections");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!canModerateCorrection(user)) {
    return indoorApiError("FORBIDDEN", "Moderator access required.", 403);
  }
  const url = new URL(request.url);
  const placeId = url.searchParams.get("placeId") ?? undefined;
  const proposals = await listPendingCorrections(placeId);
  return Response.json({ proposals });
}

export async function POST(request: Request) {
  if (!isIndoorFeatureEnabled("floorPlanCommunityCorrections")) {
    return featureDisabledResponse("floorPlanCommunityCorrections");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!canSubmitCorrection(user)) {
    return indoorApiError("FORBIDDEN", "Not allowed.", 403);
  }
  const body = await request.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return indoorApiError("FLOOR_PLAN_VALIDATION_FAILED", "Invalid correction proposal.", 400);
  }
  const proposal = await createCorrectionProposal({
    ...parsed.data,
    reporterId: user.id,
  });
  return Response.json({ proposal }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isIndoorFeatureEnabled("floorPlanCommunityCorrections")) {
    return featureDisabledResponse("floorPlanCommunityCorrections");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!canModerateCorrection(user)) {
    return indoorApiError("FORBIDDEN", "Moderator access required.", 403);
  }
  const body = await request.json();
  const schema = z.object({
    proposalId: z.string(),
    decision: z.enum(["approved", "rejected"]),
    notes: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return indoorApiError("FLOOR_PLAN_VALIDATION_FAILED", "Invalid request.", 400);
  const proposal = await moderateCorrectionProposal({
    proposalId: parsed.data.proposalId,
    moderatorId: user.id,
    decision: parsed.data.decision,
    notes: parsed.data.notes,
  });
  return Response.json({ proposal });
}
