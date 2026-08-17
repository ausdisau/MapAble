import type { CurrentUser } from "@/lib/auth/current-user";
import { evaluateProviderOnboarding } from "@/lib/onboarding/onboarding-evaluator";
import { evaluateProviderServiceReady } from "@/lib/onboarding/provider-service-ready";
import { prisma } from "@/lib/prisma";

const OPEN_CARE_REQUEST_STATUSES = [
  "submitted",
  "awaiting_admin_review",
  "awaiting_provider_response",
  "matched",
  "confirmed",
  "in_progress",
] as const;

export type ProviderOrgMetrics = {
  organisationId: string;
  organisationName: string;
  activeWorkers: number;
  pendingVerificationWorkers: number;
  pendingInvites: number;
  assignedBookings: number;
  openCareRequests: number;
  upcomingShifts7d: number;
  unassignedShifts72h: number;
  onboardingReady: boolean;
  onboardingBlockerCount: number;
  onboardingCompletenessScore: number;
  serviceReady: boolean;
  serviceReadyBlockerCount: number;
  workersTaskStatus: string | null;
};

export type ProviderControlPanelSummary = {
  organisations: ProviderOrgMetrics[];
  primaryOrganisation: ProviderOrgMetrics | null;
};

async function buildOrgMetrics(
  organisationId: string,
  organisationName: string
): Promise<ProviderOrgMetrics> {
  const now = Date.now();
  const in7d = new Date(now + 7 * 24 * 3600000);
  const in72h = new Date(now + 72 * 3600000);

  const [
    activeWorkers,
    pendingVerificationWorkers,
    pendingInvites,
    assignedBookings,
    openCareRequests,
    upcomingShifts7d,
    unassignedShifts72h,
    onboardingEvaluation,
    serviceReadyEvaluation,
    workersTask,
  ] = await Promise.all([
    prisma.workerProfile.count({
      where: { organisationId, active: true },
    }),
    prisma.workerProfile.count({
      where: {
        organisationId,
        active: true,
        verificationStatus: { not: "verified" },
      },
    }),
    prisma.workerOrganisationInvite.count({
      where: { organisationId, status: "pending" },
    }),
    prisma.booking.count({
      where: { assignedOrganisationId: organisationId },
    }),
    prisma.careRequest.count({
      where: {
        assignedOrganisationId: organisationId,
        status: { in: [...OPEN_CARE_REQUEST_STATUSES] },
      },
    }),
    prisma.careShift.count({
      where: {
        organisationId,
        status: "scheduled",
        startAt: { gte: new Date(), lte: in7d },
      },
    }),
    prisma.careShift.count({
      where: {
        organisationId,
        status: "scheduled",
        workerProfileId: null,
        startAt: { lte: in72h, gte: new Date() },
      },
    }),
    evaluateProviderOnboarding(organisationId),
    evaluateProviderServiceReady(organisationId),
    prisma.providerOnboardingTask.findFirst({
      where: {
        taskKey: "workers",
        workflow: { organisationId, status: "in_progress" },
      },
      select: { status: true },
    }),
  ]);

  const onboardingBlockerCount = onboardingEvaluation.checklist.filter(
    (item) => item.blocker && !item.complete
  ).length;
  const serviceReadyBlockerCount = serviceReadyEvaluation.checklist.filter(
    (item) => item.blocker && !item.complete
  ).length;

  return {
    organisationId,
    organisationName,
    activeWorkers,
    pendingVerificationWorkers,
    pendingInvites,
    assignedBookings,
    openCareRequests,
    upcomingShifts7d,
    unassignedShifts72h,
    onboardingReady: onboardingEvaluation.readyToMatch,
    onboardingBlockerCount,
    onboardingCompletenessScore: onboardingEvaluation.profileCompletenessScore,
    serviceReady: serviceReadyEvaluation.serviceReady,
    serviceReadyBlockerCount,
    workersTaskStatus: workersTask?.status ?? null,
  };
}

export async function getProviderControlPanelSummary(
  userId: string
): Promise<ProviderControlPanelSummary> {
  const memberships = await prisma.organisationMember.findMany({
    where: { userId },
    include: { organisation: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) {
    return { organisations: [], primaryOrganisation: null };
  }

  const organisations = await Promise.all(
    memberships.map((m) =>
      buildOrgMetrics(m.organisationId, m.organisation.name)
    )
  );

  return {
    organisations,
    primaryOrganisation: organisations[0] ?? null,
  };
}

export async function getProviderControlPanelSummaryForUser(
  user: CurrentUser
): Promise<ProviderControlPanelSummary> {
  return getProviderControlPanelSummary(user.id);
}
