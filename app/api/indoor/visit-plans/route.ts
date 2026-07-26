import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { featureDisabledResponse, indoorApiError } from "@/lib/access/indoor/api-errors";
import { isIndoorFeatureEnabled } from "@/lib/access/indoor/feature-flags";
import { canManageVisitPlan } from "@/lib/access/indoor/permissions";
import {
  createVisitPlan,
  createVisitPlanShare,
  revokeVisitPlanShare,
} from "@/lib/access/indoor/sharing/visit-plan-service";

const createSchema = z.object({
  placeId: z.string(),
  title: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  payload: z.record(z.string(), z.unknown()),
  shareScopes: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  if (!isIndoorFeatureEnabled("sharedVisitPlans")) {
    return featureDisabledResponse("sharedVisitPlans");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!canManageVisitPlan(user)) {
    return indoorApiError("FORBIDDEN", "Not authorised.", 403);
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return indoorApiError("FLOOR_PLAN_VALIDATION_FAILED", "Invalid visit plan.", 400);

  const plan = await createVisitPlan({
    ownerUserId: user.id,
    placeId: parsed.data.placeId,
    title: parsed.data.title,
    scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
    payload: parsed.data.payload,
    shareScopes: parsed.data.shareScopes,
  });

  return Response.json({ plan }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isIndoorFeatureEnabled("sharedVisitPlans")) {
    return featureDisabledResponse("sharedVisitPlans");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await request.json();
  const schema = z.discriminatedUnion("action", [
    z.object({
      action: z.literal("share"),
      visitPlanId: z.string(),
      scopes: z.array(z.string()).min(1),
      expiresInHours: z.number().optional(),
    }),
    z.object({
      action: z.literal("revoke"),
      shareId: z.string(),
    }),
  ]);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return indoorApiError("FLOOR_PLAN_VALIDATION_FAILED", "Invalid request.", 400);

  if (parsed.data.action === "share") {
    const { share, token } = await createVisitPlanShare({
      visitPlanId: parsed.data.visitPlanId,
      ownerUserId: user.id,
      scopes: parsed.data.scopes,
      expiresInHours: parsed.data.expiresInHours,
    });
    return Response.json({ shareId: share.id, token, expiresAt: share.expiresAt });
  }

  await revokeVisitPlanShare(parsed.data.shareId, user.id);
  return Response.json({ revoked: true });
}
