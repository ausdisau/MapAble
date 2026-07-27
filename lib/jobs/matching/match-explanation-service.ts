import type { JobRequirementCategory } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  ensureJobsParticipationEnabled,
  ensureMatchingExplanationsEnabled,
} from "@/lib/config/jobs-participation";
import { assertJobsFairnessAllowed } from "@/lib/jobs/fairness-boundaries";
import { prisma } from "@/lib/prisma";

export type RequirementMatchItem = {
  requirementId: string;
  label: string;
  category: JobRequirementCategory;
  status: "matched" | "not_matched" | "unknown" | "participant_decision_required";
  note: string;
};

export type AdjustmentItem = {
  label: string;
  status: "available" | "unknown";
  source: "evidence" | "claim" | "job_posting";
  note: string;
};

export type LocationAccessSummary = {
  accessible: boolean | null;
  notes: string[];
  evidenceCount: number;
  claimsOnly: boolean;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function profileHasSkill(
  profile: { skills: string[]; interests: string[] },
  label: string,
): boolean {
  const needle = normalize(label);
  return [...profile.skills, ...profile.interests].some(
    (item) => normalize(item).includes(needle) || needle.includes(normalize(item)),
  );
}

function evaluateRequirement(
  requirement: {
    id: string;
    label: string;
    category: JobRequirementCategory;
    isEssential: boolean;
  },
  profile: {
    skills: string[];
    interests: string[];
    preferredWorkTypes: string[];
    preferredHours: string[];
    preferredLocations: string[];
    remotePreference: string | null;
    transportDependency: boolean;
    supportDependency: boolean;
  },
  job: {
    employmentType: string;
    remoteAllowed: boolean;
    flexibleHours: boolean;
    location: string | null;
  },
): RequirementMatchItem {
  const base = {
    requirementId: requirement.id,
    label: requirement.label,
    category: requirement.category,
  };

  switch (requirement.category) {
    case "skill":
    case "experience":
    case "qualification":
    case "certification":
      return {
        ...base,
        status: profileHasSkill(profile, requirement.label)
          ? "matched"
          : "participant_decision_required",
        note: profileHasSkill(profile, requirement.label)
          ? "Listed in your profile skills or interests."
          : "Not listed in your profile — you decide whether to apply.",
      };
    case "schedule":
      return {
        ...base,
        status:
          job.flexibleHours || profile.preferredHours.length === 0
            ? "unknown"
            : "participant_decision_required",
        note: job.flexibleHours
          ? "Job advertises flexible hours."
          : "Compare job schedule with your preferred hours.",
      };
    case "location":
      return {
        ...base,
        status:
          job.remoteAllowed && profile.remotePreference === "remote"
            ? "matched"
            : profile.preferredLocations.length === 0
              ? "unknown"
              : "participant_decision_required",
        note: "Location fit requires your decision — no automatic exclusion.",
      };
    case "transport":
      return {
        ...base,
        status: profile.transportDependency ? "participant_decision_required" : "unknown",
        note: profile.transportDependency
          ? "You indicated transport dependency — review access before applying."
          : "Transport needs not recorded in your profile.",
      };
    case "support":
      return {
        ...base,
        status: profile.supportDependency ? "participant_decision_required" : "unknown",
        note: profile.supportDependency
          ? "You indicated support dependency — review workplace evidence."
          : "Support needs not recorded in your profile.",
      };
    case "access_need":
      return {
        ...base,
        status: "participant_decision_required",
        note: "Access requirements need your review against employer evidence.",
      };
    default:
      return {
        ...base,
        status: "unknown",
        note: "Requirement category not automatically evaluated.",
      };
  }
}

function buildAdjustments(
  jobFeatures: Record<string, unknown>,
  employerEvidence: Array<{ evidenceType: string; status: string }>,
  commitment: { statement: string } | null,
): { available: AdjustmentItem[]; unknown: AdjustmentItem[] } {
  const available: AdjustmentItem[] = [];
  const unknown: AdjustmentItem[] = [];

  for (const [key, value] of Object.entries(jobFeatures)) {
    if (value === true) {
      available.push({
        label: key,
        status: "available",
        source: "job_posting",
        note: "Listed in job accessibility features.",
      });
    }
  }

  for (const item of employerEvidence) {
    if (item.status === "verified") {
      available.push({
        label: item.evidenceType,
        status: "available",
        source: "evidence",
        note: "Verified employer accessibility evidence.",
      });
    } else {
      unknown.push({
        label: item.evidenceType,
        status: "unknown",
        source: "evidence",
        note: "Evidence pending verification.",
      });
    }
  }

  if (commitment?.statement) {
    unknown.push({
      label: "Employer accessibility commitment",
      status: "unknown",
      source: "claim",
      note: "Marketing statement — not verified evidence.",
    });
  }

  return { available, unknown };
}

function buildLocationAccess(
  workplaceEvidence: Array<{ status: string }>,
  commitment: { statement: string } | null,
): LocationAccessSummary {
  const verified = workplaceEvidence.filter((e) => e.status === "verified");
  if (verified.length > 0) {
    return {
      accessible: true,
      notes: [`${verified.length} verified workplace accessibility record(s).`],
      evidenceCount: verified.length,
      claimsOnly: false,
    };
  }
  if (workplaceEvidence.length > 0) {
    return {
      accessible: null,
      notes: ["Workplace evidence exists but is not yet verified."],
      evidenceCount: workplaceEvidence.length,
      claimsOnly: false,
    };
  }
  if (commitment?.statement) {
    return {
      accessible: null,
      notes: ["Only employer commitment statement available — no verified evidence."],
      evidenceCount: 0,
      claimsOnly: true,
    };
  }
  return {
    accessible: null,
    notes: ["No workplace accessibility evidence on file."],
    evidenceCount: 0,
    claimsOnly: false,
  };
}

export async function generateMatchExplanation(
  jobId: string,
  participantId: string,
  actorUserId: string,
) {
  ensureMatchingExplanationsEnabled();
  assertJobsFairnessAllowed("employability_scoring");
  assertJobsFairnessAllowed("productivity_ranking");
  assertJobsFairnessAllowed("disability_capability_inference");

  const [job, profile] = await Promise.all([
    prisma.job.findUnique({
      where: { id: jobId, status: "published" },
      include: {
        requirements: { orderBy: { sortOrder: "asc" } },
        workplaceLocation: { include: { evidence: true } },
        employerOrganisation: {
          include: {
            employerAccessibilityEvidence: true,
          },
        },
      },
    }),
    prisma.employmentProfile.findUnique({ where: { participantId } }),
  ]);

  if (!job) throw new Error("JOB_NOT_FOUND");

  const profileData = profile ?? {
    skills: [],
    interests: [],
    preferredWorkTypes: [],
    preferredHours: [],
    preferredLocations: [],
    remotePreference: null,
    transportDependency: false,
    supportDependency: false,
  };

  const commitment = await prisma.employerAccessibilityCommitment.findUnique({
    where: { organisationId: job.employerOrganisationId },
  });

  const requirementsMatched: RequirementMatchItem[] = [];
  const requirementsNotMatched: RequirementMatchItem[] = [];

  for (const req of job.requirements) {
    const result = evaluateRequirement(req, profileData, job);
    if (result.status === "matched") {
      requirementsMatched.push(result);
    } else {
      requirementsNotMatched.push(result);
    }
  }

  const jobFeatures =
    typeof job.accessibilityFeatures === "object" && job.accessibilityFeatures !== null
      ? (job.accessibilityFeatures as Record<string, unknown>)
      : {};

  const { available, unknown } = buildAdjustments(
    jobFeatures,
    job.employerOrganisation.employerAccessibilityEvidence,
    commitment,
  );

  const locationAccess = buildLocationAccess(
    job.workplaceLocation?.evidence ?? [],
    commitment,
  );

  const applicationDecisionRequired =
    requirementsNotMatched.some((r) => r.status === "participant_decision_required") ||
    unknown.length > 0 ||
    locationAccess.accessible === null;

  const summaryParts = [
    `${requirementsMatched.length} requirement(s) align with your profile.`,
    `${requirementsNotMatched.length} requirement(s) need your review.`,
    `${available.length} adjustment(s) have supporting evidence or job posting details.`,
    `${unknown.length} adjustment(s) are unknown or unverified.`,
    "No ranking or employability score is applied.",
  ];

  const explanation = await prisma.jobMatchExplanation.upsert({
    where: { jobId_participantId: { jobId, participantId } },
    create: {
      jobId,
      participantId,
      requirementsMatched,
      requirementsNotMatched,
      adjustmentsAvailable: available,
      adjustmentsUnknown: unknown,
      locationAccess,
      transportDependency: profileData.transportDependency,
      supportDependency: profileData.supportDependency,
      applicationDecisionRequired,
      explanationSummary: summaryParts.join(" "),
    },
    update: {
      requirementsMatched,
      requirementsNotMatched,
      adjustmentsAvailable: available,
      adjustmentsUnknown: unknown,
      locationAccess,
      transportDependency: profileData.transportDependency,
      supportDependency: profileData.supportDependency,
      applicationDecisionRequired,
      explanationSummary: summaryParts.join(" "),
      generatedAt: new Date(),
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          employmentType: true,
          location: true,
          employerOrganisation: { select: { name: true } },
        },
      },
    },
  });

  await createAuditEvent({
    actorUserId,
    participantId,
    action: "job_match_explanation.generated",
    entityType: "JobMatchExplanation",
    entityId: explanation.id,
  });

  return explanation;
}

export async function listMatchExplanations(participantId: string) {
  ensureJobsParticipationEnabled();
  return prisma.jobMatchExplanation.findMany({
    where: { participantId },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          employmentType: true,
          location: true,
          status: true,
          employerOrganisation: { select: { name: true } },
        },
      },
    },
    orderBy: { generatedAt: "desc" },
  });
}

export async function getMatchExplanation(jobId: string, participantId: string) {
  ensureJobsParticipationEnabled();
  return prisma.jobMatchExplanation.findUnique({
    where: { jobId_participantId: { jobId, participantId } },
    include: {
      job: {
        include: {
          requirements: { orderBy: { sortOrder: "asc" } },
          employerOrganisation: { select: { name: true } },
        },
      },
    },
  });
}
