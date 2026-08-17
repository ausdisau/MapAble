import {
  evaluateProviderOnboarding,
  type OnboardingChecklistItem,
  type OnboardingEvaluation,
} from "@/lib/onboarding/onboarding-evaluator";
import { prisma } from "@/lib/prisma";

export class ProviderNotReadyError extends Error {
  readonly code = "PROVIDER_NOT_READY";
  readonly blockers: OnboardingChecklistItem[];

  constructor(blockers: OnboardingChecklistItem[]) {
    const labels = blockers.map((b) => b.label).join("; ");
    super(`Provider is not service-ready: ${labels}`);
    this.name = "ProviderNotReadyError";
    this.blockers = blockers;
  }
}

export type ProviderServiceReadyEvaluation = OnboardingEvaluation & {
  serviceReady: boolean;
};

export async function evaluateProviderServiceReady(
  organisationId: string
): Promise<ProviderServiceReadyEvaluation> {
  const base = await evaluateProviderOnboarding(organisationId);

  const verifiedWorkers = await prisma.workerProfile.count({
    where: {
      organisationId,
      active: true,
      verificationStatus: "verified",
      workerScreeningStatus: "verified",
    },
  });

  const workersItem: OnboardingChecklistItem = {
    id: "verified_workers",
    label: "At least one verified support worker",
    complete: verifiedWorkers > 0,
    blocker: true,
    detail:
      verifiedWorkers > 0
        ? undefined
        : "Invite and verify at least one active worker before accepting care assignments.",
  };

  const checklist = [...base.checklist, workersItem];
  const blockers = checklist.filter((i) => i.blocker && !i.complete);

  return {
    ...base,
    checklist,
    profileCompletenessScore: Math.round(
      (checklist.filter((i) => i.complete).length / checklist.length) * 100
    ),
    readyToMatch: blockers.length === 0,
    serviceReady: blockers.length === 0,
  };
}

export async function assertProviderReadyToServe(organisationId: string) {
  const evaluation = await evaluateProviderServiceReady(organisationId);
  const blockers = evaluation.checklist.filter((i) => i.blocker && !i.complete);
  if (blockers.length > 0) {
    throw new ProviderNotReadyError(blockers);
  }
  return evaluation;
}

export async function isProviderReadyToServe(organisationId: string) {
  const evaluation = await evaluateProviderServiceReady(organisationId);
  return evaluation.serviceReady;
}
