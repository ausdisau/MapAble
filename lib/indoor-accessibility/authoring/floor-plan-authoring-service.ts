import type { AccessFloorPlanStatus } from "@prisma/client";

import { floorPlanDocumentSchema } from "@/lib/floor-plan/schemas";
import { recordIndoorAuditEvent } from "@/lib/indoor-accessibility/audit/indoor-audit-service";
import { assertPublicationTransition } from "@/lib/indoor-accessibility/publication/state-machine";
import type { PublicationStatus } from "@/lib/indoor-accessibility/schemas/core";
import { prisma } from "@/lib/prisma";

function toPrismaPublicationStatus(status: PublicationStatus): AccessFloorPlanStatus {
  return status as AccessFloorPlanStatus;
}

export type AuthoringDraftInput = {
  placeId: string;
  floorCode: string;
  floorName: string;
  sortOrder: number;
  planAssetUrl: string;
  planAssetType: string;
  originalWidth: number;
  originalHeight: number;
  altText: string;
  structuredData: unknown;
  sourceName?: string;
  licenceOrPermission?: string;
};

export async function createFloorPlanDraft(
  input: AuthoringDraftInput,
  actorUserId?: string,
) {
  const doc = floorPlanDocumentSchema.safeParse(input.structuredData);
  if (!doc.success) {
    throw new Error("Invalid floor plan document");
  }

  const plan = await prisma.accessFloorPlan.create({
    data: {
      placeId: input.placeId,
      floorCode: input.floorCode,
      floorName: input.floorName,
      sortOrder: input.sortOrder,
      planAssetUrl: input.planAssetUrl,
      planAssetType: input.planAssetType,
      originalWidth: input.originalWidth,
      originalHeight: input.originalHeight,
      altText: input.altText,
      structuredData: doc.data,
      publicationStatus: "draft",
      visibility: "public",
      sourceName: input.sourceName,
      licenceOrPermission: input.licenceOrPermission,
    },
  });

  await recordIndoorAuditEvent({
    action: "floor_plan.created",
    actorUserId,
    entityType: "AccessFloorPlan",
    entityId: plan.id,
    placeId: input.placeId,
  });

  return plan;
}

export async function transitionFloorPlanStatus(
  floorPlanId: string,
  to: PublicationStatus,
  actorUserId?: string,
) {
  const plan = await prisma.accessFloorPlan.findUnique({ where: { id: floorPlanId } });
  if (!plan) throw new Error("Floor plan not found");

  const from = plan.publicationStatus as PublicationStatus;
  assertPublicationTransition(from, to);

  const updated = await prisma.accessFloorPlan.update({
    where: { id: floorPlanId },
    data: {
      publicationStatus: toPrismaPublicationStatus(to),
      publishedAt: to === "published" ? new Date() : plan.publishedAt,
      supersededAt: to === "superseded" ? new Date() : plan.supersededAt,
    },
  });

  const actionMap: Partial<Record<PublicationStatus, Parameters<typeof recordIndoorAuditEvent>[0]["action"]>> = {
    in_review: "floor_plan.submitted_review",
    changes_requested: "floor_plan.changes_requested",
    approved: "floor_plan.approved",
    published: "floor_plan.published",
    superseded: "floor_plan.superseded",
    archived: "floor_plan.archived",
  };

  const action = actionMap[to];
  if (action) {
    await recordIndoorAuditEvent({
      action,
      actorUserId,
      entityType: "AccessFloorPlan",
      entityId: floorPlanId,
      placeId: plan.placeId,
      metadata: { from, to },
    });
  }

  if (to === "published") {
    await prisma.accessFloorPlan.updateMany({
      where: {
        placeId: plan.placeId,
        floorCode: plan.floorCode,
        id: { not: floorPlanId },
        publicationStatus: "published",
      },
      data: { publicationStatus: "superseded", supersededAt: new Date() },
    });
  }

  return updated;
}

export function validateDraftForSubmission(plan: {
  floorName: string;
  planAssetUrl: string;
  altText: string | null;
  structuredData: unknown;
  sourceName: string | null;
  licenceOrPermission: string | null;
}): string[] {
  const errors: string[] = [];
  if (!plan.floorName.trim()) errors.push("Floor name is required.");
  if (!plan.planAssetUrl.trim()) errors.push("Plan asset is required.");
  if (!plan.altText?.trim()) errors.push("Alt text is required.");
  if (!plan.sourceName?.trim()) errors.push("Source information is required.");
  if (!plan.licenceOrPermission?.trim()) errors.push("Publication permission basis is required.");

  const doc = floorPlanDocumentSchema.safeParse(plan.structuredData);
  if (!doc.success) errors.push("Structured floor plan data is invalid.");
  else {
    for (const f of doc.data.features) {
      if (f.position.x < 0 || f.position.x > 1 || f.position.y < 0 || f.position.y > 1) {
        errors.push(`Feature "${f.name}" has invalid coordinates.`);
      }
    }
  }
  return errors;
}
