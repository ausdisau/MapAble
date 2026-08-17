import { randomUUID } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { isTrustFabricEnabled } from "@/lib/config/trust-fabric";
import { prisma } from "@/lib/prisma";
import {
  BreakGlassRequiredError,
  openBreakGlassSession as openProcessLocalBreakGlass,
  type BreakGlassPurpose,
  type BreakGlassSession,
} from "@/lib/security/break-glass";
import { recordPurposeBoundAccessReceipt } from "@/lib/trust/fabric/receipt-service";
import type { AccessFieldCategory } from "@/lib/trust/fabric/types";

export type HardenedBreakGlassInput = {
  admin: CurrentUser;
  purpose: BreakGlassPurpose;
  reason: string;
  organisationId?: string;
  participantId?: string;
  fieldCategories: AccessFieldCategory[];
  ticketRef?: string;
  ttlMinutes?: number;
  approverUserId?: string;
};

/**
 * Hardened break-glass: reason, duration, participant (when support),
 * purpose, fields, after-action review required. Persists when Trust Fabric on.
 */
export async function openHardenedBreakGlassSession(
  input: HardenedBreakGlassInput,
): Promise<BreakGlassSession & { afterActionRequired: true; correlationId: string }> {
  if (!isAdminRole(input.admin.primaryRole)) {
    throw new BreakGlassRequiredError("Only platform admins may open break-glass");
  }

  const reason = input.reason.trim();
  if (reason.length < 12) {
    throw new BreakGlassRequiredError(
      "Break-glass reason must be at least 12 characters",
    );
  }

  if (!input.fieldCategories.length) {
    throw new BreakGlassRequiredError(
      "Break-glass requires fieldCategories for purpose-bound access",
    );
  }

  if (
    (input.purpose === "participant_support" ||
      input.purpose === "incident_response") &&
    !input.participantId
  ) {
    throw new BreakGlassRequiredError(
      "participantId is required for participant_support and incident_response",
    );
  }

  const correlationId = randomUUID();
  const processLocal = openProcessLocalBreakGlass({
    admin: input.admin,
    purpose: input.purpose,
    reason,
    organisationId: input.organisationId,
    participantId: input.participantId,
    ticketRef: input.ticketRef,
    ttlMinutes: input.ttlMinutes,
  });

  if (isTrustFabricEnabled()) {
    await prisma.breakGlassAccessSession.create({
      data: {
        id: processLocal.id,
        adminUserId: input.admin.id,
        purpose: input.purpose,
        reason,
        organisationId: input.organisationId ?? null,
        participantId: input.participantId ?? null,
        fieldCategories: input.fieldCategories,
        openedAt: new Date(processLocal.openedAt),
        expiresAt: new Date(processLocal.expiresAt),
        ticketRef: input.ticketRef ?? null,
        afterActionRequired: true,
        correlationId,
      },
    });

    if (input.participantId) {
      await recordPurposeBoundAccessReceipt({
        actorUserId: input.admin.id,
        participantId: input.participantId,
        organisationId: input.organisationId,
        purpose: `break_glass:${input.purpose}`,
        fieldCategories: input.fieldCategories,
        authoritySource: "break_glass",
        authorityRef: processLocal.id,
        expiresAt: new Date(processLocal.expiresAt),
        correlationId,
        outcome: "disclosed",
      });
    }

    await createAuditEvent({
      actorUserId: input.admin.id,
      actorRole: input.admin.primaryRole,
      action: "trust_fabric.break_glass.opened",
      entityType: "BreakGlassAccessSession",
      entityId: processLocal.id,
      participantId: input.participantId,
      organisationId: input.organisationId,
      metadata: {
        purpose: input.purpose,
        fieldCategories: input.fieldCategories,
        expiresAt: processLocal.expiresAt,
        afterActionRequired: true,
        approverUserId: input.approverUserId ?? null,
        correlationId,
      },
    });
  }

  return {
    ...processLocal,
    afterActionRequired: true,
    correlationId,
  };
}

export async function completeBreakGlassAfterAction(input: {
  sessionId: string;
  adminUserId: string;
  note: string;
}): Promise<void> {
  if (!isTrustFabricEnabled()) {
    throw new BreakGlassRequiredError("Trust Fabric required for after-action review");
  }
  const note = input.note.trim();
  if (note.length < 12) {
    throw new BreakGlassRequiredError(
      "After-action note must be at least 12 characters",
    );
  }

  const session = await prisma.breakGlassAccessSession.findUnique({
    where: { id: input.sessionId },
  });
  if (!session || session.adminUserId !== input.adminUserId) {
    throw new BreakGlassRequiredError("Break-glass session not found");
  }
  if (session.afterActionCompletedAt) {
    throw new BreakGlassRequiredError("After-action already completed");
  }

  await prisma.breakGlassAccessSession.update({
    where: { id: session.id },
    data: {
      afterActionCompletedAt: new Date(),
      afterActionNote: note.slice(0, 2000),
    },
  });

  await createAuditEvent({
    actorUserId: input.adminUserId,
    action: "trust_fabric.break_glass.after_action",
    entityType: "BreakGlassAccessSession",
    entityId: session.id,
    participantId: session.participantId,
    organisationId: session.organisationId,
    metadata: {
      correlationId: session.correlationId,
      noteLength: note.length,
    },
  });
}
