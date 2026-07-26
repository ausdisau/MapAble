import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { assertAtContinuityEnabled } from "./flags";
import {
  assertHumanApprovedNotification,
  assertSafeParticipantFacingCopy,
} from "./invariants";
import type {
  AtBackupPlanInput,
  AtDependencyLinkInput,
  AtEquipmentAssetInput,
  AtNotificationRequestInput,
  AtOutageInput,
  AtRepairPartnerRefInput,
} from "./types";

/**
 * Flag-gated AT Continuity writers.
 * Callers must honour consent/authority; writers emit AuditEvent only.
 * Does not create clinical suitability SoT or mutate consent aggregates.
 */
export async function registerEquipmentAsset(
  input: AtEquipmentAssetInput,
  actorUserId: string,
) {
  assertAtContinuityEnabled();
  assertSafeParticipantFacingCopy(input.displayName);
  if (input.notes) assertSafeParticipantFacingCopy(input.notes);

  const asset = await prisma.atEquipmentAsset.create({
    data: {
      participantUserId: input.participantUserId,
      displayName: input.displayName,
      category: input.category,
      mobilityAidHint: input.mobilityAidHint ?? null,
      marketplaceCategoryHint: input.marketplaceCategoryHint ?? null,
      externalAssessmentRef: input.externalAssessmentRef ?? null,
      notes: input.notes ?? null,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "at_continuity.asset_registered",
    entityType: "AtEquipmentAsset",
    entityId: asset.id,
    metadata: {
      category: asset.category,
      hasExternalAssessmentRef: Boolean(asset.externalAssessmentRef),
    },
  });

  return asset;
}

export async function recordEquipmentOutage(
  input: AtOutageInput,
  actorUserId: string,
) {
  assertAtContinuityEnabled();
  assertSafeParticipantFacingCopy(input.summary);
  if (input.impactNotes) assertSafeParticipantFacingCopy(input.impactNotes);

  const asset = await prisma.atEquipmentAsset.findFirst({
    where: {
      id: input.assetId,
      participantUserId: input.participantUserId,
    },
  });
  if (!asset) {
    throw new Error("AT equipment asset not found for participant");
  }

  const outage = await prisma.atEquipmentOutage.create({
    data: {
      assetId: input.assetId,
      participantUserId: input.participantUserId,
      summary: input.summary,
      status: input.status ?? "reported",
      impactNotes: input.impactNotes ?? null,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "at_continuity.outage_recorded",
    entityType: "AtEquipmentOutage",
    entityId: outage.id,
    metadata: { assetId: asset.id, status: outage.status },
  });

  return outage;
}

export async function upsertBackupPlan(
  input: AtBackupPlanInput,
  actorUserId: string,
) {
  assertAtContinuityEnabled();
  assertSafeParticipantFacingCopy(input.title);
  assertSafeParticipantFacingCopy(input.instructions);

  const asset = await prisma.atEquipmentAsset.findFirst({
    where: {
      id: input.assetId,
      participantUserId: input.participantUserId,
    },
  });
  if (!asset) {
    throw new Error("AT equipment asset not found for participant");
  }

  const plan = await prisma.atBackupPlan.create({
    data: {
      assetId: input.assetId,
      participantUserId: input.participantUserId,
      title: input.title,
      instructions: input.instructions,
      active: input.active ?? true,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "at_continuity.backup_plan_saved",
    entityType: "AtBackupPlan",
    entityId: plan.id,
    metadata: { assetId: asset.id, active: plan.active },
  });

  return plan;
}

export async function linkRepairPartner(
  input: AtRepairPartnerRefInput,
  actorUserId: string,
) {
  assertAtContinuityEnabled();
  if (input.notes) assertSafeParticipantFacingCopy(input.notes);

  const asset = await prisma.atEquipmentAsset.findFirst({
    where: {
      id: input.assetId,
      participantUserId: input.participantUserId,
    },
  });
  if (!asset) {
    throw new Error("AT equipment asset not found for participant");
  }

  const ref = await prisma.atRepairPartnerRef.create({
    data: {
      assetId: input.assetId,
      participantUserId: input.participantUserId,
      organisationId: input.organisationId,
      externalPartnerRef: input.externalPartnerRef ?? null,
      notes: input.notes ?? null,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "at_continuity.repair_partner_linked",
    entityType: "AtRepairPartnerRef",
    entityId: ref.id,
    metadata: {
      assetId: asset.id,
      organisationId: input.organisationId,
    },
  });

  return ref;
}

export async function linkOperationalDependency(
  input: AtDependencyLinkInput,
  actorUserId: string,
) {
  assertAtContinuityEnabled();
  if (input.notes) assertSafeParticipantFacingCopy(input.notes);

  const asset = await prisma.atEquipmentAsset.findFirst({
    where: {
      id: input.assetId,
      participantUserId: input.participantUserId,
    },
  });
  if (!asset) {
    throw new Error("AT equipment asset not found for participant");
  }

  const link = await prisma.atDependencyLink.create({
    data: {
      assetId: input.assetId,
      participantUserId: input.participantUserId,
      targetType: input.targetType,
      targetEntityId: input.targetEntityId,
      notes: input.notes ?? null,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "at_continuity.dependency_linked",
    entityType: "AtDependencyLink",
    entityId: link.id,
    metadata: {
      assetId: asset.id,
      targetType: input.targetType,
      targetEntityId: input.targetEntityId,
    },
  });

  return link;
}

/**
 * Records a human-approved notification intent.
 * Does not send clinical free text; metadata stays identifier-safe.
 */
export async function requestHumanApprovedNotification(
  input: AtNotificationRequestInput,
  actorUserId: string,
) {
  assertAtContinuityEnabled();
  assertHumanApprovedNotification({ humanApproved: input.humanApproved });
  assertSafeParticipantFacingCopy(input.templateKey);

  if (input.approvedByUserId !== actorUserId) {
    throw new Error(
      "AT Continuity notification approver must match the acting user",
    );
  }

  const asset = await prisma.atEquipmentAsset.findFirst({
    where: {
      id: input.assetId,
      participantUserId: input.participantUserId,
    },
  });
  if (!asset) {
    throw new Error("AT equipment asset not found for participant");
  }

  const notificationId = `at_notify_${asset.id}_${input.templateKey}`;

  await createAuditEvent({
    actorUserId,
    action: "at_continuity.notification_approved",
    entityType: "AtEquipmentAsset",
    entityId: asset.id,
    metadata: {
      notificationId,
      channel: input.channel,
      templateKey: input.templateKey,
      approvedByUserId: input.approvedByUserId,
      participantUserId: input.participantUserId,
    },
  });

  return {
    id: notificationId,
    status: "approved_pending_delivery" as const,
    channel: input.channel,
    templateKey: input.templateKey,
  };
}
