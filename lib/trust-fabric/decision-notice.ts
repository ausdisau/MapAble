import { randomUUID } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isTrustFabricEnabled } from "@/lib/config/trust-fabric";
import { prisma } from "@/lib/prisma";
import { TrustFabricError } from "@/lib/trust-fabric/receipt-service";
import type {
  DecisionNotice,
  DecisionNoticeInput,
} from "@/lib/trust-fabric/types";

/**
 * Record a consequential deterministic decision notice.
 * Never stores private model chain-of-thought.
 */
export async function createDecisionNotice(
  input: DecisionNoticeInput,
): Promise<DecisionNotice | null> {
  if (!isTrustFabricEnabled()) {
    return null;
  }

  const decision = input.decision.trim();
  const responsibleSystem = input.responsibleSystem.trim();
  if (!decision || !responsibleSystem) {
    throw new TrustFabricError("decision and responsibleSystem are required", 400);
  }
  if (!input.reasonCodes.length) {
    throw new TrustFabricError("reasonCodes required", 400);
  }
  if (!input.reviewPath.trim() || !input.correctionPath.trim()) {
    throw new TrustFabricError("reviewPath and correctionPath required", 400);
  }

  const correlationId = input.correlationId?.trim() || randomUUID();

  const row = await prisma.decisionNoticeRecord.create({
    data: {
      decision,
      responsibleSystem,
      reasonCodes: input.reasonCodes,
      evidenceRefs: input.evidenceRefs ?? [],
      unknowns: input.unknowns ?? [],
      humanOwnerUserId: input.humanOwnerUserId ?? null,
      participantId: input.participantId ?? null,
      organisationId: input.organisationId ?? null,
      reviewPath: input.reviewPath.trim(),
      correctionPath: input.correctionPath.trim(),
      correlationId,
    },
  });

  await createAuditEvent({
    actorUserId: input.humanOwnerUserId,
    action: "trust_fabric.decision_notice.created",
    entityType: "DecisionNoticeRecord",
    entityId: row.id,
    participantId: input.participantId,
    organisationId: input.organisationId,
    metadata: {
      decision,
      responsibleSystem,
      reasonCodes: input.reasonCodes,
      unknowns: input.unknowns ?? [],
      correlationId,
      includesModelChainOfThought: false,
    },
  });

  return {
    id: row.id,
    decision: row.decision,
    responsibleSystem: row.responsibleSystem,
    reasonCodes: row.reasonCodes,
    evidenceRefs: row.evidenceRefs,
    unknowns: row.unknowns,
    humanOwnerUserId: row.humanOwnerUserId,
    participantId: row.participantId,
    organisationId: row.organisationId,
    reviewPath: row.reviewPath,
    correctionPath: row.correctionPath,
    correlationId: row.correlationId,
    createdAt: row.createdAt.toISOString(),
    includesModelChainOfThought: false,
  };
}
