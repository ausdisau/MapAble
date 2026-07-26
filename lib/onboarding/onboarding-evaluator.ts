import type { OnboardingRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isProviderEligibleForMatching } from "@/lib/provider-verification/verification-case-service";

export type OnboardingChecklistItem = {
  id: string;
  label: string;
  complete: boolean;
  blocker: boolean;
  detail?: string;
  /** Optional deep-link for incomplete recommended steps. */
  href?: string;
};

export type OnboardingEvaluation = {
  role: OnboardingRole;
  profileCompletenessScore: number;
  readyToMatch: boolean;
  checklist: OnboardingChecklistItem[];
};

function scoreFromChecklist(items: OnboardingChecklistItem[]) {
  if (items.length === 0) return 0;
  const complete = items.filter((i) => i.complete).length;
  return Math.round((complete / items.length) * 100);
}

async function countSupportNeedsSnapshots(userId: string): Promise<number> {
  try {
    return await prisma.iCanV6IntakeSubmission.count({
      where: {
        participantId: userId,
        status: { in: ["registration_lite", "submitted_draft"] },
      },
    });
  } catch (error) {
    // Fail soft when the I-CAN table is not migrated yet (prod lag).
    console.error("[onboarding] support needs count failed", error);
    return 0;
  }
}

export async function evaluateParticipantOnboarding(
  userId: string
): Promise<OnboardingEvaluation> {
  const [profile, consents, funding, supportNeedsCount] = await Promise.all([
    prisma.participantProfile.findUnique({ where: { userId } }),
    prisma.consentRecord.count({
      where: { subjectUserId: userId, status: "active" },
    }),
    prisma.participantFundingSource.count({
      where: { participantId: userId, status: "active" },
    }),
    countSupportNeedsSnapshots(userId),
  ]);

  const supportNeedsComplete = supportNeedsCount > 0;

  const checklist: OnboardingChecklistItem[] = [
    {
      id: "profile",
      label: "Participant profile",
      complete: Boolean(profile?.displayName),
      blocker: true,
      detail: profile ? undefined : "Add your display name and contact details",
    },
    {
      id: "consent",
      label: "Active consent for services",
      complete: consents > 0,
      blocker: true,
      detail:
        consents > 0 ? undefined : "Grant at least one consent scope for care or transport",
    },
    {
      id: "support_needs",
      label: "Support needs snapshot",
      complete: supportNeedsComplete,
      blocker: false,
      detail: supportNeedsComplete
        ? undefined
        : "Tell us where you need support so we can prepare your planning draft",
      href: supportNeedsComplete ? undefined : "/register/support-needs",
    },
    {
      id: "funding",
      label: "Funding source (optional)",
      complete: funding > 0,
      blocker: false,
    },
  ];

  const blockers = checklist.filter((i) => i.blocker && !i.complete);
  const readyToMatch = blockers.length === 0;

  return {
    role: "participant",
    profileCompletenessScore: scoreFromChecklist(checklist),
    readyToMatch,
    checklist,
  };
}

export async function evaluateWorkerOnboarding(
  workerProfileId: string
): Promise<OnboardingEvaluation> {
  const worker = await prisma.workerProfile.findUnique({
    where: { id: workerProfileId },
    include: { organisation: true },
  });
  if (!worker) {
    return {
      role: "worker",
      profileCompletenessScore: 0,
      readyToMatch: false,
      checklist: [
        {
          id: "worker",
          label: "Worker profile",
          complete: false,
          blocker: true,
        },
      ],
    };
  }

  const orgOk = worker.organisation
    ? isProviderEligibleForMatching(
        worker.organisation.verificationStatus,
        worker.organisation.status
      )
    : false;

  const checklist: OnboardingChecklistItem[] = [
    {
      id: "active",
      label: "Worker profile active",
      complete: worker.active,
      blocker: true,
    },
    {
      id: "verification",
      label: "Worker verification",
      complete: worker.verificationStatus === "verified",
      blocker: true,
    },
    {
      id: "screening",
      label: "Worker screening",
      complete: worker.workerScreeningStatus === "verified",
      blocker: true,
    },
    {
      id: "org",
      label: "Provider organisation eligible",
      complete: orgOk,
      blocker: true,
    },
    {
      id: "wwcc",
      label: "Working with children check",
      complete: worker.wwccStatus === "verified",
      blocker: false,
    },
  ];

  const blockers = checklist.filter((i) => i.blocker && !i.complete);
  return {
    role: "worker",
    profileCompletenessScore: scoreFromChecklist(checklist),
    readyToMatch: blockers.length === 0,
    checklist,
  };
}

export async function evaluateProviderOnboarding(
  organisationId: string
): Promise<OnboardingEvaluation> {
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    include: {
      verificationCases: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!org) {
    return {
      role: "provider",
      profileCompletenessScore: 0,
      readyToMatch: false,
      checklist: [],
    };
  }

  const eligible = isProviderEligibleForMatching(
    org.verificationStatus,
    org.status
  );
  const latestCase = org.verificationCases[0];
  const caseApproved =
    latestCase?.status === "approved" ||
    latestCase?.status === "approved_with_conditions";

  const checklist: OnboardingChecklistItem[] = [
    {
      id: "profile",
      label: "Organisation profile",
      complete: Boolean(org.name && org.contactEmail),
      blocker: true,
    },
    {
      id: "verification",
      label: "Verification status",
      complete: eligible,
      blocker: true,
      detail: eligible ? undefined : `Current status: ${org.verificationStatus}`,
    },
    {
      id: "case",
      label: "Verification case submitted",
      complete: Boolean(latestCase),
      blocker: false,
    },
    {
      id: "case_approved",
      label: "Verification case approved",
      complete: caseApproved,
      blocker: true,
    },
  ];

  const blockers = checklist.filter((i) => i.blocker && !i.complete);
  return {
    role: "provider",
    profileCompletenessScore: scoreFromChecklist(checklist),
    readyToMatch: blockers.length === 0,
    checklist,
  };
}
