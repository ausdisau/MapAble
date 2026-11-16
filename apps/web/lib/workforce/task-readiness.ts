import { evaluateWorkforceEvidence } from "@/lib/workforce/evidence-selection";
import type { WorkforceEvidenceRecord } from "@/lib/workforce/evidence-selection";
import {
  resolveScreeningGateway,
  type ScreeningRecordView,
} from "@/lib/workforce/screening-gateway";
import {
  evaluateSkillsGap,
  type SkillsGapItem,
  type SkillsGapRequirement,
} from "@/lib/workforce/skills-gap";

export type TaskReadinessInput = {
  workerActive: boolean;
  organisationMatch: boolean;
  credentials: WorkforceEvidenceRecord[];
  requiredCredentialTypes: string[];
  screening: ScreeningRecordView[];
  requirements: SkillsGapRequirement[];
  competencies: Array<
    WorkforceEvidenceRecord & { competencyType?: string; source?: string }
  >;
  training: Array<{
    moduleOrCourse: string;
    status: "enrolled" | "completed";
    identityLinked: boolean;
  }>;
  participantBlocked: boolean;
  communicationAccessOk: boolean;
  limitations: string[];
  now?: Date;
};

export type TaskReadinessResult = {
  ready: boolean;
  learningStillAvailable: boolean;
  reasons: string[];
  gaps: SkillsGapItem[];
};

/**
 * Extends evidence eligibility without auto-assign or booking.
 * Lower-risk learning stays available when a different task is not ready.
 */
export function evaluateTaskReadiness(input: TaskReadinessInput): TaskReadinessResult {
  const now = input.now ?? new Date();
  const reasons: string[] = [];
  if (!input.workerActive) reasons.push("WORKER_INACTIVE");
  if (!input.organisationMatch) reasons.push("WORKER_ORG_MISMATCH");
  if (input.participantBlocked) reasons.push("PARTICIPANT_BLOCKED_WORKER");
  if (!input.communicationAccessOk) reasons.push("COMMUNICATION_ACCESS_NOT_READY");
  if (input.limitations.length > 0) reasons.push("WORKER_LIMITATIONS_APPLY");

  const screening = resolveScreeningGateway(input.screening, now);
  reasons.push(...screening.reasonCodes);
  if (screening.legalProhibition) {
    reasons.push("LEGAL_PROHIBITION_NOT_OVERRIDABLE");
  }

  const evidence = evaluateWorkforceEvidence({
    evidence: input.credentials,
    requiredCredentialTypes: input.requiredCredentialTypes,
    now,
  });
  reasons.push(...evidence.reasonCodes);

  const gaps = evaluateSkillsGap({
    requirements: input.requirements,
    credentials: input.credentials,
    competencies: input.competencies,
    training: input.training,
    screening: input.screening,
    participantBlocked: input.participantBlocked,
    now,
  }).items;

  const blockingStates = new Set([
    "verification_required",
    "expired_or_revoked",
    "human_review_required",
    "assessment_required",
  ]);
  const blockedByGap = gaps.some(
    (gap) => gap.state === "human_review_required" || gap.state === "expired_or_revoked" ||
      (gap.requirementKey === "worker_screening" && blockingStates.has(gap.state)),
  );

  const ready =
    reasons.every((code) => !isBlockingReason(code)) &&
    evidence.eligible &&
    screening.independentlyVerified &&
    !input.participantBlocked &&
    !blockedByGap;

  return {
    ready,
    learningStillAvailable: true,
    reasons: unique(reasons),
    gaps,
  };
}

function isBlockingReason(code: string): boolean {
  return (
    code === "WORKER_INACTIVE" ||
    code === "WORKER_ORG_MISMATCH" ||
    code === "PARTICIPANT_BLOCKED_WORKER" ||
    code === "SCREENING_EXCLUSION" ||
    code === "SCREENING_INTERIM_BAR" ||
    code === "SCREENING_SUSPENSION" ||
    code === "LEGAL_PROHIBITION_NOT_OVERRIDABLE" ||
    code.startsWith("CREDENTIAL_EXPIRED_OR_REVOKED") ||
    code.startsWith("CREDENTIAL_MISSING")
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function toParticipantLimitedReasons(result: TaskReadinessResult): string[] {
  return result.gaps
    .filter((gap) => gap.state !== "not_applicable")
    .map((gap) => participantSafeCopy(gap));
}

function participantSafeCopy(gap: SkillsGapItem): string {
  switch (gap.state) {
    case "satisfied_by_current_evidence":
      return `${gap.label}: current evidence is on file. This is not a safety score.`;
    case "training_recommended":
      return `${gap.label}: additional training may be needed.`;
    case "assessment_required":
      return `${gap.label}: a human assessment is still required.`;
    case "verification_required":
      return `${gap.label}: not independently verified.`;
    case "expired_or_revoked":
      return `${gap.label}: evidence is expired or withdrawn.`;
    case "human_review_required":
      return `${gap.label}: a human review is required before this support.`;
    case "not_applicable":
      return `${gap.label}: not applicable.`;
    default: {
      const _exhaustive: never = gap.state;
      return String(_exhaustive);
    }
  }
}
