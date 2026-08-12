import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  assertNavigatorActionAllowed,
  assertNavigatorCapability,
  NAVIGATOR_AUDIT,
} from "@/lib/ai/navigator/gates";
import {
  createEnvelopeNonce,
  createOpaqueEnvelopeId,
  governedEnvelopeCreateSchema,
  hashGovernedPayload,
  validateGovernedEnvelopePayload,
  type GovernedEnvelopeAction,
  type GovernedEnvelopeStatus,
} from "@/lib/ai/navigator/envelopes/schema";
import {
  isTransferFiltersAction,
  materialiseFinderTransfer,
} from "@/lib/ai/navigator/finder-transfer";
import { isNavigatorEnvelopesEnabled } from "@/lib/config/navigator-pilot";
import { prisma } from "@/lib/prisma";

export type GovernedActionEnvelopeRecord = {
  id: string;
  tenantId: string;
  participantId: string;
  initiatingUserId: string;
  capabilityKey: string;
  action: GovernedEnvelopeAction;
  payload: Record<string, unknown>;
  payloadHash: string;
  evidenceRefs: string[];
  sourceRefs: string[];
  modelVersion: string | null;
  promptVersion: string | null;
  toolVersion: string | null;
  consentReceiptId: string;
  requiredApproverRole: string;
  nonce: string;
  status: GovernedEnvelopeStatus;
  approvalReason: string | null;
  rejectionReason: string | null;
  executionResult: Record<string, unknown> | null;
  createdAt: Date;
  expiresAt: Date;
  consumedAt: Date | null;
  auditEventIds: string[];
};

const DRAFT_ONLY_ACTIONS: GovernedEnvelopeAction[] = [
  "create_service_request_draft",
  "transfer_filters_to_finder",
];

/**
 * Create a draft-only governed action envelope (v2).
 * Never books, pays, or mutates participant records.
 */
export async function createGovernedActionEnvelope(
  rawInput: unknown,
): Promise<GovernedActionEnvelopeRecord> {
  if (!isNavigatorEnvelopesEnabled()) {
    throw new Error("NAVIGATOR_ENVELOPES_DISABLED");
  }

  const input = governedEnvelopeCreateSchema.parse(rawInput);
  assertNavigatorActionAllowed(input.action);

  if (!DRAFT_ONLY_ACTIONS.includes(input.action)) {
    throw new Error("NAVIGATOR_ENVELOPE_ACTION_NOT_DRAFT_ONLY");
  }

  const gate = await assertNavigatorCapability({
    capabilityKey: input.capabilityKey,
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.initiatingUserId,
  });
  if (!gate.allowed) {
    throw new Error(`NAVIGATOR_GATE_DENIED:${gate.reason}`);
  }

  const payload = validateGovernedEnvelopePayload(input.action, input.payload);
  const payloadHash = hashGovernedPayload(payload);
  const now = new Date();
  const lifetime =
    input.lifetimeMinutes ??
    gate.capability.approvalExpiryMinutes ??
    30;
  const expiresAt = new Date(now.getTime() + lifetime * 60_000);
  const id = createOpaqueEnvelopeId();
  const nonce = createEnvelopeNonce();

  const row = await prisma.governedActionEnvelope.create({
    data: {
      id,
      tenantId: input.tenantId,
      participantId: input.participantId,
      initiatingUserId: input.initiatingUserId,
      capabilityKey: input.capabilityKey,
      action: input.action,
      payloadJson: payload as Prisma.InputJsonValue,
      payloadHash,
      evidenceRefs: input.evidenceRefs,
      sourceRefs: input.sourceRefs,
      modelVersion: input.modelVersion ?? null,
      promptVersion: input.promptVersion ?? null,
      toolVersion: input.toolVersion ?? null,
      consentReceiptId: input.consentReceiptId,
      requiredApproverRole: input.requiredApproverRole,
      nonce,
      status: "proposed",
      expiresAt,
    },
  });

  await createAuditEvent({
    actorUserId: input.initiatingUserId,
    participantId: input.participantId,
    action: NAVIGATOR_AUDIT.envelopeCreated,
    entityType: "GovernedActionEnvelope",
    entityId: row.id,
    metadata: {
      tenantId: input.tenantId,
      action: input.action,
      payloadHash,
      capabilityKey: input.capabilityKey,
      expiresAt: expiresAt.toISOString(),
    },
  });

  return mapRow(row);
}

/**
 * Revalidate identity, role, consent linkage, feature flag and policy
 * immediately before draft "execution" (materialising a draft only).
 * Model cannot approve its own action — approver must differ from initiating user
 * unless the participant is self-approving their own draft.
 */
export async function approveGovernedActionEnvelope(input: {
  envelopeId: string;
  tenantId: string;
  participantId: string;
  approverUserId: string;
  approverRole: string;
  reason?: string;
  consentStillValid: boolean;
}): Promise<GovernedActionEnvelopeRecord> {
  if (!isNavigatorEnvelopesEnabled()) {
    throw new Error("NAVIGATOR_ENVELOPES_DISABLED");
  }

  const existing = await prisma.governedActionEnvelope.findFirst({
    where: {
      id: input.envelopeId,
      tenantId: input.tenantId,
      participantId: input.participantId,
    },
  });
  if (!existing) {
    throw new Error("NAVIGATOR_ENVELOPE_NOT_FOUND");
  }

  if (existing.status !== "proposed") {
    await createAuditEvent({
      actorUserId: input.approverUserId,
      participantId: input.participantId,
      action: NAVIGATOR_AUDIT.envelopeReplayBlocked,
      entityType: "GovernedActionEnvelope",
      entityId: existing.id,
      metadata: { status: existing.status },
    });
    throw new Error("NAVIGATOR_ENVELOPE_NOT_PROPOSED");
  }

  if (existing.expiresAt <= new Date()) {
    await prisma.governedActionEnvelope.update({
      where: { id: existing.id },
      data: { status: "expired" },
    });
    await createAuditEvent({
      actorUserId: input.approverUserId,
      participantId: input.participantId,
      action: NAVIGATOR_AUDIT.envelopeExpired,
      entityType: "GovernedActionEnvelope",
      entityId: existing.id,
    });
    throw new Error("NAVIGATOR_ENVELOPE_EXPIRED");
  }

  if (!input.consentStillValid) {
    throw new Error("NAVIGATOR_ENVELOPE_CONSENT_INVALID");
  }

  // Model must never approve its own action.
  if (input.approverUserId === "model" || input.approverRole === "model") {
    throw new Error("NAVIGATOR_ENVELOPE_MODEL_CANNOT_APPROVE");
  }

  if (input.approverRole !== existing.requiredApproverRole) {
    throw new Error("NAVIGATOR_ENVELOPE_APPROVER_ROLE_MISMATCH");
  }

  const gate = await assertNavigatorCapability({
    capabilityKey: existing.capabilityKey,
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.approverUserId,
  });
  if (!gate.allowed) {
    throw new Error(`NAVIGATOR_GATE_DENIED:${gate.reason}`);
  }

  let executionResult: Record<string, unknown> = {
    draftOnly: true,
    action: existing.action,
    note: "Draft materialised; booking/payment not performed.",
  };

  if (isTransferFiltersAction(existing.action)) {
    const transfer = materialiseFinderTransfer({
      payload: existing.payloadJson,
    });
    executionResult = {
      draftOnly: true,
      action: existing.action,
      note: "Filters transferred to Provider Finder; booking not performed.",
      finderPath: transfer.finderPath,
      finderSessionId: transfer.sessionId,
      applied: transfer.applied,
    };
  }

  // Single-use: consume nonce by transitioning status atomically.
  const updated = await prisma.governedActionEnvelope.updateMany({
    where: {
      id: existing.id,
      tenantId: input.tenantId,
      participantId: input.participantId,
      status: "proposed",
      nonce: existing.nonce,
    },
    data: {
      status: "executed_draft",
      approvalReason: input.reason ?? "approved",
      consumedAt: new Date(),
      executionResult: executionResult as Prisma.InputJsonValue,
    },
  });

  if (updated.count !== 1) {
    await createAuditEvent({
      actorUserId: input.approverUserId,
      participantId: input.participantId,
      action: NAVIGATOR_AUDIT.envelopeReplayBlocked,
      entityType: "GovernedActionEnvelope",
      entityId: existing.id,
    });
    throw new Error("NAVIGATOR_ENVELOPE_REPLAY");
  }

  const row = await prisma.governedActionEnvelope.findUniqueOrThrow({
    where: { id: existing.id },
  });
  return mapRow(row);
}

/**
 * Edit a proposed draft envelope payload before approval.
 * Hash is recomputed; booking/payment never performed.
 */
export async function updateGovernedActionEnvelopeDraft(input: {
  envelopeId: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
  payload: Record<string, unknown>;
}): Promise<GovernedActionEnvelopeRecord> {
  if (!isNavigatorEnvelopesEnabled()) {
    throw new Error("NAVIGATOR_ENVELOPES_DISABLED");
  }

  const existing = await prisma.governedActionEnvelope.findFirst({
    where: {
      id: input.envelopeId,
      tenantId: input.tenantId,
      participantId: input.participantId,
      status: "proposed",
    },
  });
  if (!existing) {
    throw new Error("NAVIGATOR_ENVELOPE_NOT_FOUND");
  }

  const action = existing.action as GovernedEnvelopeAction;
  assertNavigatorActionAllowed(action);
  const payload = validateGovernedEnvelopePayload(action, input.payload);
  const payloadHash = hashGovernedPayload(payload);

  const row = await prisma.governedActionEnvelope.update({
    where: { id: existing.id },
    data: {
      payloadJson: payload as Prisma.InputJsonValue,
      payloadHash,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "navigator.envelope.draft_edited",
    entityType: "GovernedActionEnvelope",
    entityId: row.id,
    metadata: { tenantId: input.tenantId, payloadHash },
  });

  return mapRow(row);
}

export async function rejectGovernedActionEnvelope(input: {
  envelopeId: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
  reason: string;
}): Promise<GovernedActionEnvelopeRecord> {
  const existing = await prisma.governedActionEnvelope.findFirst({
    where: {
      id: input.envelopeId,
      tenantId: input.tenantId,
      participantId: input.participantId,
      status: "proposed",
    },
  });
  if (!existing) {
    throw new Error("NAVIGATOR_ENVELOPE_NOT_FOUND");
  }

  const row = await prisma.governedActionEnvelope.update({
    where: { id: existing.id },
    data: {
      status: "rejected",
      rejectionReason: input.reason,
      consumedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: NAVIGATOR_AUDIT.envelopeRejected,
    entityType: "GovernedActionEnvelope",
    entityId: row.id,
    metadata: { reason: input.reason, tenantId: input.tenantId },
  });

  return mapRow(row);
}

/** Tenant + participant scoped get — prevents IDOR. */
export async function getGovernedActionEnvelope(input: {
  envelopeId: string;
  tenantId: string;
  participantId: string;
}): Promise<GovernedActionEnvelopeRecord | null> {
  const row = await prisma.governedActionEnvelope.findFirst({
    where: {
      id: input.envelopeId,
      tenantId: input.tenantId,
      participantId: input.participantId,
    },
  });
  return row ? mapRow(row) : null;
}

function mapRow(row: {
  id: string;
  tenantId: string;
  participantId: string;
  initiatingUserId: string;
  capabilityKey: string;
  action: string;
  payloadJson: Prisma.JsonValue;
  payloadHash: string;
  evidenceRefs: string[];
  sourceRefs: string[];
  modelVersion: string | null;
  promptVersion: string | null;
  toolVersion: string | null;
  consentReceiptId: string;
  requiredApproverRole: string;
  nonce: string;
  status: string;
  approvalReason: string | null;
  rejectionReason: string | null;
  executionResult: Prisma.JsonValue | null;
  createdAt: Date;
  expiresAt: Date;
  consumedAt: Date | null;
  auditEventIds: string[];
}): GovernedActionEnvelopeRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    participantId: row.participantId,
    initiatingUserId: row.initiatingUserId,
    capabilityKey: row.capabilityKey,
    action: row.action as GovernedEnvelopeAction,
    payload: (row.payloadJson ?? {}) as Record<string, unknown>,
    payloadHash: row.payloadHash,
    evidenceRefs: row.evidenceRefs,
    sourceRefs: row.sourceRefs,
    modelVersion: row.modelVersion,
    promptVersion: row.promptVersion,
    toolVersion: row.toolVersion,
    consentReceiptId: row.consentReceiptId,
    requiredApproverRole: row.requiredApproverRole,
    nonce: row.nonce,
    status: row.status as GovernedEnvelopeStatus,
    approvalReason: row.approvalReason,
    rejectionReason: row.rejectionReason,
    executionResult: (row.executionResult ?? null) as Record<
      string,
      unknown
    > | null,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    consumedAt: row.consumedAt,
    auditEventIds: row.auditEventIds,
  };
}
