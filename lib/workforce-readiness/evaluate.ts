import type { WorkerCredentialStatus, WorkerProfile } from "@prisma/client";

import { hasWorkerAcknowledgedPassport } from "@/lib/communication-passport/service";
import type { CommunicationPassport } from "@/lib/communication-passport/types";
import { isWorkforceReadinessEnabled } from "@/lib/config/communication-workforce";

export type ReadinessReasonCode =
  | "flag_disabled"
  | "missing_worker_profile"
  | "inactive_worker"
  | "screening_not_clear"
  | "wwcc_not_clear"
  | "credential_expired"
  | "academy_completion_not_competency"
  | "communication_not_acknowledged"
  | "aac_competency_unverified"
  | "organisation_mismatch"
  | "ready";

export type ReadinessReason = {
  code: ReadinessReasonCode;
  severity: "block" | "warn" | "info";
  message: string;
};

export type AssignmentReadinessResult = {
  ready: boolean;
  /** Explicitly not a score — ordered reasons only. */
  reasons: ReadinessReason[];
  evaluatedAt: string;
  autoAssignment: false;
};

function credentialOk(status: WorkerCredentialStatus): boolean {
  return status === "verified";
}

export class WorkforceReadinessError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "WorkforceReadinessError";
    this.status = status;
  }
}

export function assertWorkforceReadinessEnabled(): void {
  if (!isWorkforceReadinessEnabled()) {
    throw new WorkforceReadinessError("Workforce readiness is not enabled", 503);
  }
}

/**
 * Deterministic assignment-readiness evaluation.
 * Never ranks workers. Never auto-assigns. Academy completion ≠ competency.
 */
export async function evaluateAssignmentReadiness(input: {
  worker: Pick<
    WorkerProfile,
    | "id"
    | "userId"
    | "organisationId"
    | "active"
    | "workerScreeningStatus"
    | "wwccStatus"
    | "firstAidStatus"
    | "insuranceStatus"
    | "verificationStatus"
  > | null;
  organisationId: string;
  passport: CommunicationPassport;
  /** Course completions — informational only; never sufficient alone. */
  academyModuleCompletions?: string[];
  /** Human-verified competency evidence ids (supervised observation etc.). */
  authorisedCompetencyEvidenceIds?: string[];
  requiresAacFamiliarity?: boolean;
}): Promise<AssignmentReadinessResult> {
  assertWorkforceReadinessEnabled();
  const reasons: ReadinessReason[] = [];
  const evaluatedAt = new Date().toISOString();

  if (!input.worker || !input.worker.userId) {
    reasons.push({
      code: "missing_worker_profile",
      severity: "block",
      message: "No active worker profile linked to this user",
    });
    return { ready: false, reasons, evaluatedAt, autoAssignment: false };
  }

  if (!input.worker.active) {
    reasons.push({
      code: "inactive_worker",
      severity: "block",
      message: "Worker profile is inactive",
    });
  }

  if (input.worker.organisationId !== input.organisationId) {
    reasons.push({
      code: "organisation_mismatch",
      severity: "block",
      message: "Worker is not a member of the assignment organisation",
    });
  }

  if (!credentialOk(input.worker.workerScreeningStatus)) {
    reasons.push({
      code: "screening_not_clear",
      severity: "block",
      message: `Worker screening status is ${input.worker.workerScreeningStatus}`,
    });
  }

  if (!credentialOk(input.worker.wwccStatus)) {
    reasons.push({
      code: "wwcc_not_clear",
      severity: "block",
      message: `WWCC status is ${input.worker.wwccStatus}`,
    });
  }

  for (const [label, status] of [
    ["first aid", input.worker.firstAidStatus],
    ["insurance", input.worker.insuranceStatus],
    ["verification", input.worker.verificationStatus],
  ] as const) {
    if (String(status) === "expired") {
      reasons.push({
        code: "credential_expired",
        severity: "block",
        message: `${label} credential is expired`,
      });
    }
  }

  const acknowledged = await hasWorkerAcknowledgedPassport({
    workerUserId: input.worker.userId,
    participantId: input.passport.participantId,
    passportVersion: input.passport.version,
  });
  if (!acknowledged) {
    reasons.push({
      code: "communication_not_acknowledged",
      severity: "block",
      message:
        "Worker has not acknowledged the current Communication Passport version",
    });
  }

  const needsAac =
    input.requiresAacFamiliarity ||
    input.passport.instructions.some((i) => i.mode === "aac");
  if (needsAac) {
    const hasEvidence = (input.authorisedCompetencyEvidenceIds ?? []).length > 0;
    if (!hasEvidence) {
      reasons.push({
        code: "aac_competency_unverified",
        severity: "block",
        message:
          "AAC familiarity requires authorised competency evidence (not course completion alone)",
      });
    }
    if ((input.academyModuleCompletions ?? []).length > 0 && !hasEvidence) {
      reasons.push({
        code: "academy_completion_not_competency",
        severity: "warn",
        message:
          "Academy module completion recorded but is not treated as practical competency",
      });
    }
  }

  const blocked = reasons.some((r) => r.severity === "block");
  if (!blocked) {
    reasons.push({
      code: "ready",
      severity: "info",
      message:
        "Deterministic checks passed. Human assignment still required — auto-assignment is disabled.",
    });
  }

  return {
    ready: !blocked,
    reasons,
    evaluatedAt,
    autoAssignment: false,
  };
}
