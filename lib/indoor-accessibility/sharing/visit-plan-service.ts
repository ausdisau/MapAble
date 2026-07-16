import { Prisma } from "@prisma/client";

import {
  generateShareToken,
  hashShareToken,
} from "@/lib/indoor-accessibility/verification/correction-service";
import { recordIndoorAuditEvent } from "@/lib/indoor-accessibility/audit/indoor-audit-service";
import { prisma } from "@/lib/prisma";

export async function createVisitPlan(params: {
  ownerUserId: string;
  placeId: string;
  title?: string;
  scheduledAt?: Date;
  payload: Record<string, unknown>;
  shareScopes?: string[];
}) {
  return prisma.visitPlan.create({
    data: {
      ownerUserId: params.ownerUserId,
      placeId: params.placeId,
      title: params.title,
      scheduledAt: params.scheduledAt,
      payload: params.payload as Prisma.InputJsonValue,
      shareScopes: (params.shareScopes ?? []) as Prisma.InputJsonValue,
    },
  });
}

export async function createVisitPlanShare(params: {
  visitPlanId: string;
  ownerUserId: string;
  scopes: string[];
  expiresInHours?: number;
}) {
  const plan = await prisma.visitPlan.findFirst({
    where: { id: params.visitPlanId, ownerUserId: params.ownerUserId },
  });
  if (!plan) throw new Error("Visit plan not found");

  const token = generateShareToken();
  const tokenHash = hashShareToken(token);
  const expiresAt = new Date(
    Date.now() + (params.expiresInHours ?? 72) * 60 * 60 * 1000,
  );

  const share = await prisma.visitPlanShare.create({
    data: {
      visitPlanId: params.visitPlanId,
      tokenHash,
      scopes: params.scopes,
      expiresAt,
    },
  });

  await recordIndoorAuditEvent({
    action: "visit_plan.shared",
    actorUserId: params.ownerUserId,
    entityType: "VisitPlanShare",
    entityId: share.id,
    placeId: plan.placeId,
    metadata: { scopes: params.scopes },
  });

  return { share, token };
}

export async function resolveVisitPlanShare(token: string) {
  const tokenHash = hashShareToken(token);
  const share = await prisma.visitPlanShare.findUnique({
    where: { tokenHash },
    include: { visitPlan: { include: { place: { select: { name: true } } } } },
  });
  if (!share) return null;
  if (share.revokedAt) return { error: "revoked" as const };
  if (share.expiresAt < new Date()) return { error: "expired" as const };

  await prisma.visitPlanShare.update({
    where: { id: share.id },
    data: { accessCount: { increment: 1 } },
  });

  const scopes = share.scopes as string[];
  const payload = share.visitPlan.payload as Record<string, unknown>;
  const filtered: Record<string, unknown> = { venueName: share.visitPlan.place.name };
  for (const scope of scopes) {
    if (payload[scope] !== undefined) filtered[scope] = payload[scope];
  }
  return { plan: filtered, scopes };
}

export async function revokeVisitPlanShare(shareId: string, ownerUserId: string) {
  const share = await prisma.visitPlanShare.findFirst({
    where: { id: shareId, visitPlan: { ownerUserId } },
    include: { visitPlan: true },
  });
  if (!share) throw new Error("Share not found");

  await prisma.visitPlanShare.update({
    where: { id: shareId },
    data: { revokedAt: new Date() },
  });

  await recordIndoorAuditEvent({
    action: "visit_plan.revoked",
    actorUserId: ownerUserId,
    entityType: "VisitPlanShare",
    entityId: shareId,
    placeId: share.visitPlan.placeId,
  });
}
