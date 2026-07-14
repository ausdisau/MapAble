import { z } from "zod";

import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

import {
  readVerifiedProviderCapacity,
  readVerifiedWorkerCapabilities,
} from "../capacity/live-capacity-service";

export const careSupportIntelligenceRequestSchema = z.object({
  goal: z.string().trim().min(3).max(3000),
  supportContext: z
    .enum(["home", "community", "health", "education", "employment", "other"])
    .default("community"),
  desiredStartAt: z.string().datetime().nullable().optional(),
  durationMinutes: z.number().int().min(15).max(1440).nullable().optional(),
  supportTypes: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
  communicationPreferences: z
    .array(z.string().trim().min(1).max(160))
    .max(12)
    .default([]),
  accessRequirements: z
    .array(z.string().trim().min(1).max(240))
    .max(20)
    .default([]),
  region: z.string().trim().min(2).max(120).nullable().optional(),
  linkedTransportRequired: z.boolean().default(false),
  highIntensitySupportRequested: z.boolean().default(false),
  backupPreference: z
    .enum([
      "same_worker_only",
      "known_backup",
      "verified_provider_pool",
      "participant_selects_each_time",
      "undecided",
    ])
    .default("undecided"),
  includeExistingRecords: z.boolean().default(true),
});

export type CareSupportIntelligenceRequest = z.infer<
  typeof careSupportIntelligenceRequestSchema
>;

export type SupportReadinessCheck = {
  id: string;
  label: string;
  status: "confirmed" | "attention" | "unknown";
  explanation: string;
  evidence: string[];
};

type ExistingSupportRecords = {
  participantName: string | null;
  homeRegion: string | null;
  preferences: string[];
  accessNeeds: string[];
  safeguards: string[];
  recentRequests: Array<{
    id: string;
    title: string;
    status: string;
    preferredDate: Date | null;
    linkedTransportRequired: boolean;
  }>;
  upcomingShifts: Array<{
    id: string;
    status: string;
    startAt: Date;
    workerProfileId: string | null;
    organisationId: string;
  }>;
};

type CapacityEvidence = {
  providers: Awaited<ReturnType<typeof readVerifiedProviderCapacity>>;
  workers: Awaited<ReturnType<typeof readVerifiedWorkerCapabilities>>;
};

function stringValues(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, item]) => item === true || typeof item === "string")
      .map(([key, item]) => (typeof item === "string" ? `${key}: ${item}` : key));
  }
  return [];
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function evidenceCheck(params: SupportReadinessCheck): SupportReadinessCheck {
  return params;
}

export function analyseSupportReadiness(params: {
  request: CareSupportIntelligenceRequest;
  records: ExistingSupportRecords;
  capacity: CapacityEvidence;
}) {
  const requestedRegion = params.request.region ?? params.records.homeRegion;
  const communicationPreferences = unique([
    ...params.request.communicationPreferences,
    ...params.records.preferences.filter((item) =>
      /communicat|contact|language|format|auslan|aac/i.test(item),
    ),
  ]);
  const accessRequirements = unique([
    ...params.request.accessRequirements,
    ...params.records.accessNeeds,
  ]);
  const verifiedProviders = params.capacity.providers.filter(
    (provider) => provider.evidence.organisationVerification === "verified",
  );
  const providersWithCapacity = params.capacity.providers.filter((provider) =>
    provider.capacity.some((block) => block.remainingCapacity > 0),
  );
  const verifiedWorkers = params.capacity.workers.filter(
    (worker) =>
      worker.recordedChecks.workerProfileVerification === "verified" &&
      worker.recordedChecks.organisationVerification === "verified",
  );
  const highIntensityWorkers = verifiedWorkers.filter(
    (worker) => worker.recordedChecks.highIntensityCompetencyVerified,
  );
  const availableWorkers = verifiedWorkers.filter(
    (worker) => worker.availabilityWindows.length > 0,
  );

  const checks: SupportReadinessCheck[] = [
    evidenceCheck({
      id: "outcome",
      label: "Participant outcome",
      status: params.request.goal.trim().length >= 3 ? "confirmed" : "unknown",
      explanation:
        "The support brief starts with the participant's stated outcome, not a provider-selected task list.",
      evidence: ["participant_input"],
    }),
    evidenceCheck({
      id: "support_types",
      label: "Requested support activities",
      status: params.request.supportTypes.length > 0 ? "confirmed" : "unknown",
      explanation:
        params.request.supportTypes.length > 0
          ? `${params.request.supportTypes.length} requested support activity or capability area is recorded.`
          : "The participant still needs to describe the support activities or capability areas required.",
      evidence: params.request.supportTypes.length > 0 ? ["participant_input"] : [],
    }),
    evidenceCheck({
      id: "timing",
      label: "Timing and duration",
      status:
        params.request.desiredStartAt && params.request.durationMinutes
          ? "confirmed"
          : "unknown",
      explanation:
        params.request.desiredStartAt && params.request.durationMinutes
          ? "A requested start time and duration are available for coordination."
          : "A start time or duration is missing, so availability cannot be meaningfully checked.",
      evidence:
        params.request.desiredStartAt || params.request.durationMinutes
          ? ["participant_input"]
          : [],
    }),
    evidenceCheck({
      id: "communication",
      label: "Communication preferences",
      status: communicationPreferences.length > 0 ? "confirmed" : "unknown",
      explanation:
        communicationPreferences.length > 0
          ? "Communication preferences are available and must be shown to the participant before sharing."
          : "No communication preference is available. Ask the participant rather than assuming spoken communication.",
      evidence: communicationPreferences.length > 0 ? ["participant_input_or_profile"] : [],
    }),
    evidenceCheck({
      id: "access",
      label: "Access requirements",
      status: accessRequirements.length > 0 ? "confirmed" : "unknown",
      explanation:
        accessRequirements.length > 0
          ? "Participant-supplied or recorded access requirements are available for review."
          : "No access requirement is recorded. This means unknown, not that no adjustment is needed.",
      evidence: accessRequirements.length > 0 ? ["participant_input_or_care_access_need"] : [],
    }),
    evidenceCheck({
      id: "provider_capacity",
      label: "Provider capacity evidence",
      status:
        providersWithCapacity.length > 0
          ? "confirmed"
          : params.capacity.providers.length > 0
            ? "attention"
            : "unknown",
      explanation:
        providersWithCapacity.length > 0
          ? `${providersWithCapacity.length} provider record has explicit remaining capacity in the selected window. Capacity still requires direct confirmation.`
          : params.capacity.providers.length > 0
            ? "Provider records were found, but no explicit remaining-capacity block is recorded."
            : "No matching live provider-capacity record was found.",
      evidence: providersWithCapacity.map(
        (provider) => `provider_capacity:${provider.organisationId}`,
      ),
    }),
    evidenceCheck({
      id: "worker_capability",
      label: "Worker capability evidence",
      status:
        verifiedWorkers.length > 0
          ? availableWorkers.length > 0
            ? "confirmed"
            : "attention"
          : "unknown",
      explanation:
        verifiedWorkers.length > 0
          ? `${verifiedWorkers.length} worker record meets the requested evidence filters; ${availableWorkers.length} also has an active availability window. This is not an assignment or fit ranking.`
          : "No worker record currently meets the requested verification and capability filters.",
      evidence: verifiedWorkers.map(
        (worker) => `worker_profile:${worker.workerProfileId}`,
      ),
    }),
  ];

  if (params.request.highIntensitySupportRequested) {
    checks.push(
      evidenceCheck({
        id: "high_intensity",
        label: "High-intensity competency evidence",
        status: highIntensityWorkers.length > 0 ? "confirmed" : "attention",
        explanation:
          highIntensityWorkers.length > 0
            ? `${highIntensityWorkers.length} verified worker record includes explicit high-intensity competency evidence. Clinical suitability and the support plan still require qualified human review.`
            : "High-intensity support was requested, but no matching verified competency record was found. Route this to a qualified human coordinator and provider.",
        evidence: highIntensityWorkers.map(
          (worker) => `high_intensity_verified:${worker.workerProfileId}`,
        ),
      }),
    );
  }

  if (params.request.linkedTransportRequired) {
    checks.push(
      evidenceCheck({
        id: "transport_dependency",
        label: "Linked accessible transport",
        status: "attention",
        explanation:
          "Transport is a declared dependency. A separate accessible transport request and confirmed timing are required before the support plan is operationally ready.",
        evidence: ["participant_input"],
      }),
    );
  }

  const unknownCount = checks.filter((check) => check.status === "unknown").length;
  const attentionCount = checks.filter((check) => check.status === "attention").length;
  const readiness =
    params.request.highIntensitySupportRequested && highIntensityWorkers.length === 0
      ? "human_coordination_recommended"
      : unknownCount > 0
        ? "needs_information"
        : attentionCount > 0
          ? "participant_review_required"
          : "ready_for_participant_review";

  const decisionsRequired = [
    ...(params.request.supportTypes.length === 0
      ? ["Describe the support activities or capabilities required."]
      : []),
    ...(!params.request.desiredStartAt
      ? ["Choose a preferred support date and start time."]
      : []),
    ...(!params.request.durationMinutes
      ? ["Choose an expected support duration."]
      : []),
    ...(communicationPreferences.length === 0
      ? ["Confirm how workers should communicate with the participant."]
      : []),
    ...(params.request.backupPreference === "undecided"
      ? ["Choose what should happen if the preferred worker is unavailable."]
      : []),
    ...(params.request.linkedTransportRequired
      ? ["Review and confirm a separate accessible transport arrangement."]
      : []),
    ...(params.request.highIntensitySupportRequested && highIntensityWorkers.length === 0
      ? ["Ask a qualified coordinator to verify competency and support-plan requirements."]
      : []),
  ];

  return {
    generatedAt: new Date().toISOString(),
    readiness,
    supportBrief: {
      participantName: params.records.participantName,
      outcome: params.request.goal,
      context: params.request.supportContext,
      region: requestedRegion,
      desiredStartAt: params.request.desiredStartAt ?? null,
      durationMinutes: params.request.durationMinutes ?? null,
      supportTypes: params.request.supportTypes,
      communicationPreferences,
      accessRequirements,
      linkedTransportRequired: params.request.linkedTransportRequired,
      highIntensitySupportRequested: params.request.highIntensitySupportRequested,
      backupPreference: params.request.backupPreference,
      safeguardsForHumanReview: params.records.safeguards,
    },
    checks,
    decisionsRequired,
    continuityPlan: {
      beforeSupport: [
        "Confirm the participant-approved task and preference summary.",
        "Confirm worker credentials and current availability using source records.",
        ...(params.request.linkedTransportRequired
          ? ["Confirm transport pickup, arrival buffer and return arrangements."]
          : []),
      ],
      duringSupport: [
        "Follow the participant's communication preferences and supported decision-making choices.",
        "Record material changes without rewriting the participant's stated outcome.",
      ],
      ifUnavailable: [
        params.request.backupPreference === "same_worker_only"
          ? "Contact the participant before offering any different worker."
          : params.request.backupPreference === "known_backup"
            ? "Check the participant's known backup worker first."
            : params.request.backupPreference === "verified_provider_pool"
              ? "Prepare verified provider-pool options for participant selection."
              : params.request.backupPreference === "participant_selects_each_time"
                ? "Ask the participant to select from available verified options."
                : "Ask the participant how they want backup support handled.",
        "Do not cancel linked transport or appointments without participant instruction.",
      ],
    },
    evidenceSummary: {
      matchingProviderRecords: params.capacity.providers.length,
      verifiedProviderRecords: verifiedProviders.length,
      providerRecordsWithCapacity: providersWithCapacity.length,
      matchingWorkerRecords: params.capacity.workers.length,
      verifiedWorkerRecords: verifiedWorkers.length,
      verifiedWorkersWithAvailability: availableWorkers.length,
      highIntensityVerifiedWorkers: highIntensityWorkers.length,
      recentCareRequests: params.records.recentRequests.length,
      upcomingCareShifts: params.records.upcomingShifts.length,
    },
    providerEvidence: params.capacity.providers.slice(0, 8),
    workerEvidence: params.capacity.workers.slice(0, 8),
    existingRecords: {
      recentRequests: params.records.recentRequests,
      upcomingShifts: params.records.upcomingShifts,
    },
    safeguards: [
      "This output is coordination support, not clinical advice or a service decision.",
      "CareOS does not assign, reject or rank workers or providers.",
      "Unknown information remains labelled unknown.",
      "The participant must review information before it is shared or used for a booking.",
    ],
  };
}

async function readExistingSupportRecords(
  participantId: string,
  includeExistingRecords: boolean,
): Promise<ExistingSupportRecords> {
  if (!includeExistingRecords) {
    return {
      participantName: null,
      homeRegion: null,
      preferences: [],
      accessNeeds: [],
      safeguards: [],
      recentRequests: [],
      upcomingShifts: [],
    };
  }

  const now = new Date();
  const [profile, preferences, accessNeeds, safeguards, recentRequests, upcomingShifts] =
    await Promise.all([
      prisma.participantProfile.findUnique({
        where: { userId: participantId },
        select: {
          displayName: true,
          preferredName: true,
          homeSuburb: true,
          homeState: true,
        },
      }),
      prisma.careParticipantPreference.findMany({
        where: { participantId },
        orderBy: { updatedAt: "desc" },
        take: 30,
        select: { preferenceKey: true, value: true },
      }),
      prisma.careAccessNeed.findMany({
        where: { participantId, active: true },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { category: true, summary: true, details: true },
      }),
      prisma.careLivingAloneSafeguard.findMany({
        where: { participantId, active: true },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { safeguardType: true, checklist: true },
      }),
      prisma.careRequest.findMany({
        where: { participantId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          preferredDate: true,
          linkedTransportRequired: true,
        },
      }),
      prisma.careShift.findMany({
        where: { participantId, startAt: { gte: now } },
        orderBy: { startAt: "asc" },
        take: 10,
        select: {
          id: true,
          status: true,
          startAt: true,
          workerProfileId: true,
          organisationId: true,
        },
      }),
    ]);

  return {
    participantName: profile?.preferredName ?? profile?.displayName ?? null,
    homeRegion:
      [profile?.homeSuburb, profile?.homeState].filter(Boolean).join(", ") || null,
    preferences: unique(
      preferences.flatMap((preference) => [
        preference.preferenceKey,
        ...stringValues(preference.value),
      ]),
    ),
    accessNeeds: unique(
      accessNeeds.flatMap((need) => [
        `${need.category}: ${need.summary}`,
        ...stringValues(need.details),
      ]),
    ),
    safeguards: unique(
      safeguards.flatMap((safeguard) => [
        safeguard.safeguardType,
        ...stringValues(safeguard.checklist),
      ]),
    ),
    recentRequests,
    upcomingShifts,
  };
}

export async function buildCareSupportIntelligence(params: {
  user: CurrentUser;
  request: CareSupportIntelligenceRequest;
}) {
  const records = await readExistingSupportRecords(
    params.user.id,
    params.request.includeExistingRecords,
  );
  const region = params.request.region ?? records.homeRegion ?? undefined;
  const serviceType = params.request.supportTypes[0];
  const [providers, workers] = await Promise.all([
    readVerifiedProviderCapacity({
      region,
      serviceType,
      days: 30,
      limit: 20,
    }),
    readVerifiedWorkerCapabilities({
      region,
      serviceType,
      highIntensityRequired: params.request.highIntensitySupportRequested,
      limit: 20,
    }),
  ]);

  return analyseSupportReadiness({
    request: params.request,
    records,
    capacity: { providers, workers },
  });
}
