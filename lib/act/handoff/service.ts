import type { ActHandoff, ActHandoffStatus, Prisma } from "@prisma/client";

import { isA2hHandoffEnabled } from "@/lib/act/flags";
import { redactHandoffPayload } from "@/lib/act/handoff/redact";
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
};

function riskTier(gamma: number, cConc: number): string {
  if (gamma >= 75 || cConc >= 150) return "critical";
  if (gamma >= 50 || cConc >= 100) return "elevated";
  return "standard";
}

async function resolveDefaultAssignee(
  tx: Prisma.TransactionClient,
): Promise<string | null> {
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

/**
 * Upsert a pending ActHandoff for HITL_PENDING and notify the assignee.
 * Dedupes open pending rows by fingerprint.
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

  const handoff = await runInTransaction(async (tx) => {
    const existing = await tx.actHandoff.findFirst({
      where: { fingerprint: input.fingerprint, status: "pending" },
      orderBy: { createdAt: "desc" },
    });
    if (existing) return existing;

    const assigneeUserId =
      input.assigneeUserId ?? (await resolveDefaultAssignee(tx));

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

  return handoff;
}

export async function resolveActHandoff(input: {
  handoffId: string;
  actorUserId: string;
  decision: "approve" | "deny";
  note?: string;
}): Promise<ActHandoff> {
  const handoff = await prisma.actHandoff.findUnique({
    where: { id: input.handoffId },
  });
  if (!handoff) throw new Error("ACT_HANDOFF_NOT_FOUND");
  if (handoff.status !== "pending") {
    throw new Error("ACT_HANDOFF_NOT_PENDING");
  }

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

  return updated;
}

export async function getActHandoff(id: string): Promise<ActHandoff | null> {
  return prisma.actHandoff.findUnique({ where: { id } });
}
