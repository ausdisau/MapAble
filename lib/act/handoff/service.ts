import type { ActHandoff, ActHandoffStatus, Prisma } from "@prisma/client";

import { isA2hHandoffEnabled } from "@/lib/act/flags";
import { redactHandoffPayload } from "@/lib/act/handoff/redact";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { vectorMemoryStore } from "@/lib/aura-harness/memory-store";
import type { AuraRiskProfile, HarnessDecision } from "@/lib/aura-harness/types";
import { runInTransaction } from "@/lib/db/transaction-service";
import { createNotification } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export type CreateActHandoffInput = {
  fingerprint: string;
  toolName: string;
  payload: unknown;
  decision: HarnessDecision;
  requesterUserId: string;
  assigneeUserId?: string | null;
  /** Tenant scope — required for Navigator-governed escalations; optional for legacy callers. */
  tenantId?: string | null;
  /** Participant the handoff concerns. Defaults to requester when omitted. */
  participantId?: string | null;
};

function riskTier(gamma: number, cConc: number): string {
  if (gamma >= 75 || cConc >= 150) return "critical";
  if (gamma >= 50 || cConc >= 100) return "elevated";
  return "standard";
}

async function resolveDefaultAssignee(
  tx: Prisma.TransactionClient,
  tenantId?: string | null,
): Promise<string | null> {
  if (tenantId) {
    const memberships = await tx.tenantMembership.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: { userId: true },
    });
    if (memberships.length > 0) {
      const reviewer = await tx.user.findFirst({
        where: {
          id: { in: memberships.map((m) => m.userId) },
          primaryRole: {
            in: ["mapable_admin", "support_coordinator", "plan_manager"],
          },
        },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (reviewer?.id) return reviewer.id;
    }
  }

  const admin = await tx.user.findFirst({
    where: {
      primaryRole: {
        in: ["mapable_admin", "support_coordinator", "plan_manager"],
      },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return admin?.id ?? null;
}

function assertHandoffTenantAccess(
  handoff: ActHandoff,
  input: { actorUserId: string; tenantId?: string | null },
): void {
  if (input.tenantId && handoff.tenantId && handoff.tenantId !== input.tenantId) {
    throw new Error("ACT_HANDOFF_TENANT_MISMATCH");
  }
}

function canResolveHandoff(
  handoff: ActHandoff,
  actorUserId: string,
): boolean {
  if (handoff.assigneeUserId && handoff.assigneeUserId === actorUserId) {
    return true;
  }
  // Requester may deny/cancel but should not self-approve when an assignee exists.
  if (!handoff.assigneeUserId && handoff.requesterUserId === actorUserId) {
    return true;
  }
  return false;
}

/**
 * Upsert a pending ActHandoff for HITL_PENDING and notify the assignee.
 * Dedupes open pending rows by fingerprint (+ tenant when provided).
 * Never auto-executes the underlying tool.
 */
export async function createActHandoffFromHitl(
  input: CreateActHandoffInput,
): Promise<ActHandoff | null> {
  if (!isA2hHandoffEnabled()) {
    return null;
  }

  const gamma = input.decision.profile.normalizedGamma;
  const cConc = input.decision.profile.concentrationCoeff;
  const payloadJson = redactHandoffPayload(input.payload);
  const tier = riskTier(gamma, cConc);
  const participantId = input.participantId ?? input.requesterUserId;

  const handoff = await runInTransaction(async (tx) => {
    const existing = await tx.actHandoff.findFirst({
      where: {
        fingerprint: input.fingerprint,
        status: "pending",
        ...(input.tenantId ? { tenantId: input.tenantId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return existing;

    const assigneeUserId =
      input.assigneeUserId ??
      (await resolveDefaultAssignee(tx, input.tenantId));

    return tx.actHandoff.create({
      data: {
        fingerprint: input.fingerprint,
        toolName: input.toolName,
        payloadJson: payloadJson as Prisma.InputJsonValue,
        gamma,
        cConc,
        riskTier: tier,
        status: "pending",
        reason: input.decision.reason,
        requesterUserId: input.requesterUserId,
        assigneeUserId,
        tenantId: input.tenantId ?? null,
        participantId,
      },
    });
  });

  const notifyUserId = handoff.assigneeUserId ?? input.requesterUserId;
  const autonomy = input.decision.recognise?.autonomy;
  try {
    await createNotification({
      userId: notifyUserId,
      category: "safeguarding",
      title: `AURA handoff: ${input.toolName}`,
      body: [
        `Risk tier ${tier}.`,
        `γ=${gamma.toFixed(1)}, C_conc=${cConc.toFixed(1)}.`,
        autonomy
          ? `Autonomy dims: capability=${autonomy.capabilityDependence}, irreversibility=${autonomy.irreversibility}.`
          : null,
        `Reason: ${input.decision.reason}`,
        `Handoff id: ${handoff.id}`,
      ]
        .filter(Boolean)
        .join(" "),
    });
  } catch {
    // Handoff persists even if notification delivery fails.
  }

  try {
    await createAuditEvent({
      actorUserId: input.requesterUserId,
      participantId,
      action: "act.handoff.created",
      entityType: "ActHandoff",
      entityId: handoff.id,
      metadata: {
        tenantId: input.tenantId ?? null,
        toolName: input.toolName,
        riskTier: tier,
      },
    });
  } catch {
    // Audit failure must not roll back the handoff.
  }

  return handoff;
}

export async function resolveActHandoff(input: {
  handoffId: string;
  actorUserId: string;
  decision: "approve" | "deny";
  note?: string;
  tenantId?: string | null;
}): Promise<ActHandoff> {
  const handoff = await prisma.actHandoff.findUnique({
    where: { id: input.handoffId },
  });
  if (!handoff) throw new Error("ACT_HANDOFF_NOT_FOUND");
  if (handoff.status !== "pending") {
    throw new Error("ACT_HANDOFF_NOT_PENDING");
  }

  assertHandoffTenantAccess(handoff, input);

  if (input.decision === "approve" && !canResolveHandoff(handoff, input.actorUserId)) {
    throw new Error("ACT_HANDOFF_FORBIDDEN");
  }
  if (
    input.decision === "deny" &&
    input.actorUserId !== handoff.assigneeUserId &&
    input.actorUserId !== handoff.requesterUserId
  ) {
    throw new Error("ACT_HANDOFF_FORBIDDEN");
  }

  // Approving means "approved for human retry" — never auto-execute.
  const status: ActHandoffStatus =
    input.decision === "approve" ? "approved" : "denied";
  const memoryDecision =
    input.decision === "approve" ? "HITL_APPROVED" : "HITL_REJECTED";

  const updated = await prisma.actHandoff.update({
    where: { id: handoff.id },
    data: {
      status,
      resolveNote: input.note ?? null,
      resolvedAt: new Date(),
      assigneeUserId: handoff.assigneeUserId ?? input.actorUserId,
    },
  });

  const profile: AuraRiskProfile = {
    actionId: handoff.fingerprint,
    rawGamma: handoff.gamma,
    normalizedGamma: handoff.gamma,
    variance: 0,
    concentrationCoeff: handoff.cConc,
    requiresHITL: input.decision !== "approve",
    highGamma: handoff.gamma >= 50,
    highConcentration: handoff.cConc >= 100,
  };

  // Persist memory precedent — do not auto-execute billing/tool writes.
  await vectorMemoryStore.commitAction(
    handoff.toolName,
    handoff.payloadJson,
    profile,
    null,
    memoryDecision,
  );

  try {
    await createAuditEvent({
      actorUserId: input.actorUserId,
      participantId: handoff.participantId,
      action:
        input.decision === "approve"
          ? "act.handoff.approved_for_retry"
          : "act.handoff.denied",
      entityType: "ActHandoff",
      entityId: handoff.id,
      metadata: {
        tenantId: handoff.tenantId,
        autoExecuted: false,
      },
    });
  } catch {
    // Audit failure must not undo resolution.
  }

  return updated;
}

/** Tenant-scoped get — returns null on cross-tenant access (no existence leak). */
export async function getActHandoffForTenant(input: {
  id: string;
  tenantId: string;
  actorUserId: string;
}): Promise<ActHandoff | null> {
  const handoff = await prisma.actHandoff.findFirst({
    where: {
      id: input.id,
      tenantId: input.tenantId,
      OR: [
        { requesterUserId: input.actorUserId },
        { assigneeUserId: input.actorUserId },
        { participantId: input.actorUserId },
      ],
    },
  });
  return handoff;
}

export async function listActHandoffsForTenant(input: {
  tenantId: string;
  actorUserId: string;
  participantId?: string;
  status?: ActHandoffStatus;
  take?: number;
}): Promise<ActHandoff[]> {
  const take = Math.max(1, Math.min(input.take ?? 50, 100));
  return prisma.actHandoff.findMany({
    where: {
      tenantId: input.tenantId,
      ...(input.participantId ? { participantId: input.participantId } : {}),
      ...(input.status ? { status: input.status } : {}),
      OR: [
        { requesterUserId: input.actorUserId },
        { assigneeUserId: input.actorUserId },
        { participantId: input.actorUserId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getActHandoff(id: string): Promise<ActHandoff | null> {
  return prisma.actHandoff.findUnique({ where: { id } });
}
