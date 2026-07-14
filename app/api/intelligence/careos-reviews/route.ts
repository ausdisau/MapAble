import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { getMapAbleIntelligenceConfig } from "@/intelligence/config";
import {
  listCareOSHumanReviews,
  updateCareOSHumanReview,
} from "@/intelligence/operations/mission-state-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["assigned", "in_progress", "resolved", "cancelled"]),
});

function canManageReview(role: Parameters<typeof hasPermission>[0]): boolean {
  return (
    isAdminRole(role) ||
    hasPermission(role, "coordinator:portal") ||
    hasPermission(role, "continuity:manage")
  );
}

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const config = getMapAbleIntelligenceConfig();
  if (!config.careOSPersistenceEnabled) {
    return NextResponse.json({ reviews: [], persistenceEnabled: false });
  }

  try {
    const reviews = canManageReview(user.primaryRole)
      ? await listCareOSHumanReviews({
          assignedRole:
            user.primaryRole === "support_coordinator"
              ? "support_coordinator"
              : undefined,
          status: "open",
        })
      : await listCareOSHumanReviews({
          participantId: user.id,
        });
    return NextResponse.json({ reviews, persistenceEnabled: true });
  } catch (error) {
    console.error("[careos-reviews-list]", error);
    return NextResponse.json(
      { error: "CareOS review work could not be loaded." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!canManageReview(user.primaryRole)) {
    return NextResponse.json(
      { error: "You cannot manage CareOS review work." },
      { status: 403 },
    );
  }

  const config = getMapAbleIntelligenceConfig();
  if (!config.careOSPersistenceEnabled) {
    return NextResponse.json(
      { error: "CareOS review persistence is disabled." },
      { status: 503 },
    );
  }

  try {
    const input = updateSchema.parse(await request.json());
    const updated = await updateCareOSHumanReview(input);
    if (!updated) {
      return NextResponse.json({ error: "Review item not found." }, { status: 404 });
    }
    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      action: "careos.human_review.updated",
      entityType: "CareOSHumanReview",
      entityId: input.id,
      metadata: { status: input.status },
    });
    return NextResponse.json({ updated: true, status: input.status });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please check the review update.", issues: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[careos-reviews-update]", error);
    return NextResponse.json(
      { error: "The review item could not be updated." },
      { status: 500 },
    );
  }
}
