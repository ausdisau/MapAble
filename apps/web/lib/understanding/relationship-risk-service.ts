import { isUnderstandingEnabled } from "@/lib/config/understanding";
import { runInTransaction } from "@/lib/db/transaction-service";
import { prisma } from "@/lib/prisma";
import {
  ensureDefaultRelationshipRiskEvaluators,
  listRelationshipRiskEvaluators,
} from "@/lib/understanding/evaluators";
import { listInformalSupports } from "@/lib/understanding/informal-support-service";
import type {
  LivingArrangementRiskLevel,
  LivingArrangementSignalView,
} from "@/lib/understanding/types";

function assertEnabled(): void {
  if (!isUnderstandingEnabled()) {
    throw new Error("UNDERSTANDING_DISABLED");
  }
}

function levelFromScore(score: number): LivingArrangementRiskLevel {
  if (score >= 75) return "high";
  if (score >= 45) return "moderate";
  return "low";
}

/**
 * Heuristic living-arrangement / SDA *review* signal.
 * Never determines SDA/SIL eligibility — navigational human-review only.
 */
export async function computeLivingArrangementRiskSignal(
  participantId: string,
  options?: { livingAloneHint?: boolean; persist?: boolean },
): Promise<LivingArrangementSignalView> {
  assertEnabled();
  ensureDefaultRelationshipRiskEvaluators();

  const informalSupports = await listInformalSupports(participantId);
  const parts = await Promise.all(
    listRelationshipRiskEvaluators().map((e) =>
      e.evaluate({
        participantId,
        informalSupports,
        livingAloneHint: options?.livingAloneHint,
      }),
    ),
  );

  const cascading = Math.max(0, ...parts.map((p) => p.cascadingImpact ?? 0));
  const reasons: string[] = [];
  const declining = informalSupports.filter(
    (s) => s.stabilityTrend === "declining",
  );
  if (declining.length > 0) {
    reasons.push(
      "Informal support capacity is trending down — review living arrangement options with a qualified professional.",
    );
  }
  if (informalSupports.length === 0) {
    reasons.push("No informal support links recorded.");
  }
  if (options?.livingAloneHint) {
    reasons.push("Living-alone context flagged for human review.");
  }
  if (reasons.length === 0) {
    reasons.push("No elevated living-arrangement risk signal.");
  }

  // Copy contract: signal for human review — never "eligible for SDA".
  reasons.push(
    "Informational only: not an SDA or SIL eligibility determination.",
  );

  const score = Math.min(100, cascading);
  const view: LivingArrangementSignalView = {
    participantId,
    riskLevel: levelFromScore(score),
    score,
    reasons,
    informationalOnly: true,
    updatedAtIso: new Date().toISOString(),
  };

  if (options?.persist !== false) {
    await runInTransaction(async (tx) => {
      await tx.livingArrangementSignal.upsert({
        where: { participantId },
        create: {
          participantId,
          riskLevel: view.riskLevel,
          score: view.score,
          reasonsJson: view.reasons,
          informationalOnly: true,
        },
        update: {
          riskLevel: view.riskLevel,
          score: view.score,
          reasonsJson: view.reasons,
          informationalOnly: true,
        },
      });
    });
  }

  return view;
}

export async function getLivingArrangementRiskSignal(
  participantId: string,
): Promise<LivingArrangementSignalView | null> {
  assertEnabled();
  const row = await prisma.livingArrangementSignal.findUnique({
    where: { participantId },
  });
  if (!row) return null;
  const reasons = Array.isArray(row.reasonsJson)
    ? (row.reasonsJson as string[])
    : [];
  return {
    participantId: row.participantId,
    riskLevel: row.riskLevel as LivingArrangementRiskLevel,
    score: row.score,
    reasons,
    informationalOnly: true,
    updatedAtIso: row.updatedAt.toISOString(),
  };
}
