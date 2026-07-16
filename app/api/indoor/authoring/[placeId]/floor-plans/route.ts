import { requireApiSession } from "@/lib/api/auth-handler";
import { isIndoorFeatureEnabled } from "@/lib/indoor-accessibility/feature-flags";
import { featureDisabledResponse, indoorApiError } from "@/lib/indoor-accessibility/api-errors";
import {
  canCreateFloorPlanDraft,
  canReviewFloorPlan,
  canSubmitFloorPlanReview,
} from "@/lib/indoor-accessibility/permissions";
import {
  createFloorPlanDraft,
  transitionFloorPlanStatus,
  validateDraftForSubmission,
} from "@/lib/indoor-accessibility/authoring/floor-plan-authoring-service";
import { z } from "zod";

const createDraftSchema = z.object({
  floorCode: z.string().min(1),
  floorName: z.string().min(1),
  sortOrder: z.number().int().default(0),
  planAssetUrl: z.string().min(1),
  planAssetType: z.string().min(1),
  originalWidth: z.number().positive(),
  originalHeight: z.number().positive(),
  altText: z.string().min(1),
  structuredData: z.unknown(),
  sourceName: z.string().optional(),
  licenceOrPermission: z.string().optional(),
});

type RouteParams = { params: Promise<{ placeId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  if (!isIndoorFeatureEnabled("floorPlanAuthoring")) {
    return featureDisabledResponse("floorPlanAuthoring");
  }
  const { placeId } = await params;
  const { prisma } = await import("@/lib/prisma");
  const plans = await prisma.accessFloorPlan.findMany({
    where: { placeId },
    orderBy: [{ sortOrder: "asc" }, { version: "desc" }],
    select: {
      id: true,
      floorCode: true,
      floorName: true,
      sortOrder: true,
      publicationStatus: true,
      version: true,
      updatedAt: true,
    },
  });
  return Response.json({ placeId, plans });
}

export async function POST(request: Request, { params }: RouteParams) {
  if (!isIndoorFeatureEnabled("floorPlanAuthoring")) {
    return featureDisabledResponse("floorPlanAuthoring");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!canCreateFloorPlanDraft(user)) {
    return indoorApiError("FORBIDDEN", "Not authorised to create floor plan drafts.", 403);
  }
  const { placeId } = await params;
  const body = await request.json();
  const parsed = createDraftSchema.safeParse(body);
  if (!parsed.success) {
    return indoorApiError("FLOOR_PLAN_VALIDATION_FAILED", "Invalid draft data.", 400);
  }
  const plan = await createFloorPlanDraft({ placeId, ...parsed.data }, user.id);
  return Response.json({ plan }, { status: 201 });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  if (!isIndoorFeatureEnabled("floorPlanReviewWorkflow")) {
    return featureDisabledResponse("floorPlanReviewWorkflow");
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await request.json();
  const schema = z.object({
    floorPlanId: z.string(),
    action: z.enum(["submit_review", "request_changes", "approve", "publish", "archive"]),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return indoorApiError("FLOOR_PLAN_VALIDATION_FAILED", "Invalid request.", 400);

  const { prisma } = await import("@/lib/prisma");
  const plan = await prisma.accessFloorPlan.findUnique({ where: { id: parsed.data.floorPlanId } });
  if (!plan) return indoorApiError("FLOOR_PLAN_NOT_FOUND", "Floor plan not found.", 404);

  const actionMap = {
    submit_review: { to: "in_review" as const, check: canSubmitFloorPlanReview },
    request_changes: { to: "changes_requested" as const, check: canReviewFloorPlan },
    approve: { to: "approved" as const, check: canReviewFloorPlan },
    publish: { to: "published" as const, check: canReviewFloorPlan },
    archive: { to: "archived" as const, check: canReviewFloorPlan },
  };
  const action = actionMap[parsed.data.action];
  if (!action.check(user)) {
    return indoorApiError("FORBIDDEN", "Not authorised for this action.", 403);
  }

  if (parsed.data.action === "submit_review") {
    const errors = validateDraftForSubmission(plan);
    if (errors.length > 0) {
      return indoorApiError("FLOOR_PLAN_VALIDATION_FAILED", errors.join(" "), 400);
    }
  }

  const updated = await transitionFloorPlanStatus(parsed.data.floorPlanId, action.to, user.id);
  return Response.json({ plan: updated });
}
