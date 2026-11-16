import { TRAINING_NOT_COMPETENCE_COPY } from "@/lib/config/capability-passport";
import { selectBestEvidenceForType } from "@/lib/workforce/evidence-selection";
import type { WorkforceEvidenceRecord } from "@/lib/workforce/evidence-selection";
import {
  resolveScreeningGateway,
  type ScreeningRecordView,
} from "@/lib/workforce/screening-gateway";

export const SKILLS_GAP_STATES = [
  "satisfied_by_current_evidence",
  "training_recommended",
  "assessment_required",
  "verification_required",
  "expired_or_revoked",
  "not_applicable",
  "human_review_required",
] as const;

export type SkillsGapState = (typeof SKILLS_GAP_STATES)[number];

export type SkillsGapRequirement = {
  key: string;
  label: string;
  kind:
    | "screening"
    | "credential"
    | "competency"
    | "training"
    | "participant_preparation"
    | "high_intensity"
    | "communication_access";
  required: boolean;
};

export type SkillsGapItem = {
  requirementKey: string;
  label: string;
  state: SkillsGapState;
  reasonCodes: string[];
  sourceRefs: string[];
  nextAction: string;
  copy: string;
};

export type SkillsGapResult = {
  items: SkillsGapItem[];
  /** Intentionally omitted: no percentage readiness score. */
  policyVersion: "capability-passport-v1";
};

export type SkillsGapInput = {
  requirements: SkillsGapRequirement[];
  credentials: WorkforceEvidenceRecord[];
  competencies: Array<
    WorkforceEvidenceRecord & { competencyType?: string; source?: string }
  >;
  training: Array<{
    moduleOrCourse: string;
    status: "enrolled" | "completed";
    identityLinked: boolean;
  }>;
  screening: ScreeningRecordView[];
  participantBlocked?: boolean;
  now?: Date;
};

function assertNever(value: never): never {
  throw new Error(`Unhandled skills-gap kind: ${String(value)}`);
}

export function evaluateSkillsGap(input: SkillsGapInput): SkillsGapResult {
  const now = input.now ?? new Date();
  const items = input.requirements.map((requirement) =>
    evaluateRequirement(requirement, input, now),
  );
  return { items, policyVersion: "capability-passport-v1" };
}

function evaluateRequirement(
  requirement: SkillsGapRequirement,
  input: SkillsGapInput,
  now: Date,
): SkillsGapItem {
  if (!requirement.required) {
    return item(requirement, "not_applicable", ["NOT_APPLICABLE"], [], "No action.");
  }
  if (input.participantBlocked) {
    return item(
      requirement,
      "human_review_required",
      ["PARTICIPANT_BLOCKED_WORKER"],
      [],
      "A participant-defined block applies. A human must review. Approve cannot override this.",
    );
  }

  switch (requirement.kind) {
    case "high_intensity":
      return item(
        requirement,
        "human_review_required",
        ["HIGH_INTENSITY_PROFESSIONAL_REQUIREMENT"],
        ["ndis-hissd"],
        "High-intensity support requires demonstrated professional competence. Completing a module does not authorise this task.",
      );
    case "screening": {
      const screening = resolveScreeningGateway(input.screening, now);
      if (screening.legalProhibition) {
        return item(
          requirement,
          "human_review_required",
          screening.reasonCodes,
          screening.sourceRefs,
          "A legal prohibition is recorded. Approve cannot override Exclusion, interim bar, or suspension.",
        );
      }
      if (screening.independentlyVerified) {
        return item(
          requirement,
          "satisfied_by_current_evidence",
          screening.reasonCodes,
          screening.sourceRefs,
          "Official clearance is identity-linked. This is not a general safety guarantee.",
        );
      }
      return item(
        requirement,
        "verification_required",
        screening.reasonCodes,
        screening.sourceRefs,
        "Current screening status: NOT INDEPENDENTLY VERIFIED. Mock claims, screenshots and applications are not clearance.",
      );
    }
    case "credential": {
      const record = selectBestEvidenceForType(
        input.credentials,
        requirement.key,
        now,
      );
      if (!record) {
        return item(
          requirement,
          "verification_required",
          [`CREDENTIAL_MISSING:${requirement.key}`],
          [],
          "No current credential is on file. Missing evidence is unknown, not assumed.",
        );
      }
      if (
        record.revokedAt ||
        record.verificationStatus === "revoked" ||
        record.verificationStatus === "expired" ||
        (record.expiresAt && new Date(record.expiresAt) <= now)
      ) {
        return item(
          requirement,
          "expired_or_revoked",
          [`CREDENTIAL_EXPIRED_OR_REVOKED:${requirement.key}`],
          [requirement.key],
          "The selected credential is expired or revoked. A later valid record would be preferred if present.",
        );
      }
      if (record.verificationStatus === "verified") {
        return item(
          requirement,
          "satisfied_by_current_evidence",
          [],
          [requirement.key],
          "Current verified credential selected by the documented pick rule.",
        );
      }
      return item(
        requirement,
        "verification_required",
        [`CREDENTIAL_UNVERIFIED:${requirement.key}`],
        [requirement.key],
        "Credential is present but not independently verified.",
      );
    }
    case "competency": {
      const mapped = input.competencies.map((row) => ({
        credentialType: row.competencyType ?? row.credentialType,
        verificationStatus: row.verificationStatus,
        expiresAt: row.expiresAt,
        revokedAt: row.revokedAt,
      }));
      const record = selectBestEvidenceForType(mapped, requirement.key, now);
      if (!record) {
        const trained = input.training.find(
          (row) => row.status === "completed" && row.identityLinked,
        );
        if (trained) {
          return item(
            requirement,
            "assessment_required",
            ["COURSE_COMPLETION_IS_NOT_COMPETENCY"],
            [trained.moduleOrCourse],
            TRAINING_NOT_COMPETENCE_COPY,
          );
        }
        return item(
          requirement,
          "training_recommended",
          [`COMPETENCY_MISSING:${requirement.key}`],
          [],
          "No demonstrated competency is on file. Training may be recommended; it does not grant clearance.",
        );
      }
      if (
        record.revokedAt ||
        record.verificationStatus === "revoked" ||
        record.verificationStatus === "expired" ||
        (record.expiresAt && new Date(record.expiresAt) <= now)
      ) {
        return item(
          requirement,
          "expired_or_revoked",
          [`COMPETENCY_EXPIRED_OR_REVOKED:${requirement.key}`],
          [requirement.key],
          "A revoked or expired competency was not used in preference to a later valid record.",
        );
      }
      if (record.verificationStatus === "verified") {
        return item(
          requirement,
          "satisfied_by_current_evidence",
          [],
          [requirement.key],
          "Demonstrated competency has been human-verified. This is not a general safety score.",
        );
      }
      return item(
        requirement,
        "assessment_required",
        ["COMPETENCY_PENDING_HUMAN_ASSESSMENT"],
        [requirement.key],
        TRAINING_NOT_COMPETENCE_COPY,
      );
    }
    case "training": {
      const enrolled = input.training.find((row) => row.moduleOrCourse === requirement.key);
      if (!enrolled) {
        return item(
          requirement,
          "training_recommended",
          ["TRAINING_NOT_STARTED"],
          [],
          "A relevant learning module is available. Enrolment is not completion.",
        );
      }
      if (enrolled.status === "enrolled") {
        return item(
          requirement,
          "training_recommended",
          ["ENROLLED_IS_NOT_COMPLETED"],
          [requirement.key],
          "Enrolled is not completed. Completing the course is not verified competency.",
        );
      }
      if (!enrolled.identityLinked) {
        return item(
          requirement,
          "verification_required",
          ["TRAINING_IDENTITY_NOT_BOUND"],
          [requirement.key],
          "Training is not bound to this worker's identity and cannot be used.",
        );
      }
      return item(
        requirement,
        "assessment_required",
        ["COURSE_COMPLETION_IS_NOT_COMPETENCY"],
        [requirement.key],
        TRAINING_NOT_COMPETENCE_COPY,
      );
    }
    case "participant_preparation":
      return item(
        requirement,
        "human_review_required",
        ["PARTICIPANT_PREPARATION_REQUIRED"],
        [],
        "Participant-specific preparation needs a human check. It is not inferred from generic training.",
      );
    case "communication_access": {
      const record = selectBestEvidenceForType(
        input.competencies.map((row) => ({
          credentialType: row.competencyType ?? row.credentialType,
          verificationStatus: row.verificationStatus,
          expiresAt: row.expiresAt,
          revokedAt: row.revokedAt,
        })),
        requirement.key,
        now,
      );
      if (record?.verificationStatus === "verified") {
        return item(
          requirement,
          "satisfied_by_current_evidence",
          [],
          [requirement.key],
          "Communication-access evidence is current and verified.",
        );
      }
      return item(
        requirement,
        "training_recommended",
        ["COMMUNICATION_ACCESS_TRAINING_RECOMMENDED"],
        ["ACCESSIBILITY-101"],
        "Accessible communication training may help. It does not certify competence.",
      );
    }
    default:
      return assertNever(requirement.kind);
  }
}

function item(
  requirement: SkillsGapRequirement,
  state: SkillsGapState,
  reasonCodes: string[],
  sourceRefs: string[],
  copy: string,
): SkillsGapItem {
  return {
    requirementKey: requirement.key,
    label: requirement.label,
    state,
    reasonCodes,
    sourceRefs,
    nextAction: nextActionFor(state),
    copy,
  };
}

function nextActionFor(state: SkillsGapState): string {
  switch (state) {
    case "satisfied_by_current_evidence":
      return "Keep evidence current and review expiry dates.";
    case "training_recommended":
      return "Open Skills Bridge for recommended learning. Training is not competence.";
    case "assessment_required":
      return "Request a human competency assessment.";
    case "verification_required":
      return "Provide independently verifiable evidence. Mock claims are not clearance.";
    case "expired_or_revoked":
      return "Renew or replace the expired or revoked record.";
    case "not_applicable":
      return "No action for this requirement.";
    case "human_review_required":
      return "A qualified human must review. AI cannot decide this.";
    default:
      return assertNever(state);
  }
}

export function defaultRoleRequirements(): SkillsGapRequirement[] {
  return [
    {
      key: "worker_screening",
      label: "NDIS Worker Screening",
      kind: "screening",
      required: true,
    },
    {
      key: "wwcc",
      label: "Working with Children Check (if applicable)",
      kind: "credential",
      required: true,
    },
    {
      key: "safeguarding",
      label: "Safeguarding competency",
      kind: "competency",
      required: true,
    },
    {
      key: "SAFEGUARDING-101",
      label: "Safeguarding essentials training",
      kind: "training",
      required: true,
    },
    {
      key: "communication_access",
      label: "Communication access",
      kind: "communication_access",
      required: true,
    },
    {
      key: "high_intensity",
      label: "High intensity support",
      kind: "high_intensity",
      required: false,
    },
  ];
}
