import { requireApiSession } from "@/lib/api/auth-handler";
import { hasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import {
  assertAssessorForWorker,
  canReviewCapability,
} from "@/lib/workforce/access";
import {
  listOpenCapabilityReviews,
  reviewCapabilityCase,
} from "@/lib/workforce/assessment-service";
import {
  guardCapabilityPassportPreview,
  handleCapabilityError,
  jsonPrivate,
  sameOrigin,
} from "@/lib/workforce/http";
import { AssessmentReviewSchema } from "@/lib/workforce/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  const gated = guardCapabilityPassportPreview();
  if (gated) return gated;
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  if (!canReviewCapability(actor)) {
    return jsonPrivate({ error: "ASSESSOR_PERMISSION_REQUIRED" }, 403);
  }
  try {
    const cases = await listOpenCapabilityReviews();
    const memberships = hasPermission(actor.primaryRole, "verification:manage:any")
      ? null
      : await prisma.organisationMember.findMany({
          where: { userId: actor.id },
          select: { organisationId: true },
        });
    const orgIds = new Set(memberships?.map((row) => row.organisationId) ?? []);
    const visible = cases.filter((row) => {
      if (row.workerProfile.userId === actor.id) return false;
      if (!memberships) return true;
      return orgIds.has(row.organisationId);
    });
    return jsonPrivate({ cases: visible, cannotSelfApprove: true });
  } catch (error) {
    return handleCapabilityError(error);
  }
}

export async function POST(request: Request) {
  const gated = guardCapabilityPassportPreview();
  if (gated) return gated;
  if (!sameOrigin(request)) return jsonPrivate({ error: "Invalid request origin." }, 403);
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  if (!canReviewCapability(actor)) {
    return jsonPrivate({ error: "ASSESSOR_PERMISSION_REQUIRED" }, 403);
  }

  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return jsonPrivate({ error: "Invalid JSON." }, 400);
  }
  if (body && typeof body === "object" && ("screeningOutcome" in body || "issuedByAi" in body)) {
    return jsonPrivate({ error: "AI_CANNOT_WRITE_SCREENING_OR_COMPETENCY" }, 403);
  }
  const parsed = AssessmentReviewSchema.safeParse(body);
  if (!parsed.success) return jsonPrivate({ error: "INVALID_REVIEW" }, 400);

  try {
    const existing = await prisma.capabilityReviewCase.findUnique({
      where: { id: parsed.data.caseId },
      include: { workerProfile: true },
    });
    if (!existing) return jsonPrivate({ error: "PROPOSAL_NOT_FOUND" }, 404);
    await assertAssessorForWorker(actor, existing.workerProfile);
    const updated = await reviewCapabilityCase({
      caseId: parsed.data.caseId,
      assessorUserId: actor.id,
      assessorRole: actor.primaryRole,
      decision: parsed.data.decision,
      reason: parsed.data.reason,
      limitations: parsed.data.limitations,
    });
    return jsonPrivate({ case: updated, autoVerified: false, aiWritePermission: false });
  } catch (error) {
    return handleCapabilityError(error);
  }
}
