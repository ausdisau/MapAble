import type {
  ConsentSummary,
  NdisPlanSummary,
  OpenRiskSummary,
  ParticipantGoal,
  ParticipantProfileSummary,
  ServiceEventSummary,
} from "@/lib/prms/types";

export const MOCK_PARTICIPANT_ID = "participant-demo-001";

export const MOCK_PROFILE: ParticipantProfileSummary = {
  participantId: MOCK_PARTICIPANT_ID,
  preferredName: "Alex",
  ndisNumberMasked: "••••••••1234",
  planStart: "2025-07-01",
  planEnd: "2026-06-30",
  fundingManagement: "plan_managed",
  profileCompletionPercent: 82,
  accessNeeds: [
    { id: "an-1", label: "Wheelchair accessible venues", category: "mobility" },
    { id: "an-2", label: "Extra time for transfers", category: "mobility" },
    { id: "an-3", label: "Plain language explanations", category: "communication" },
  ],
  mobilityAids: [
    { id: "ma-1", label: "Manual wheelchair", notes: "User-operated" },
    { id: "ma-2", label: "Portable ramp", notes: "For vehicle access" },
  ],
  communicationPreferences: [
    { id: "cp-1", mode: "plain_language", detail: "Short sentences, no jargon" },
    { id: "cp-2", mode: "written", detail: "Confirm bookings in writing" },
  ],
  emergencyContactCount: 2,
  hasNominee: true,
};

export const MOCK_PLAN: NdisPlanSummary = {
  planId: "plan-demo-001",
  status: "active",
  fundingManagement: "plan_managed",
  categoryCount: 4,
  overallBudgetBand: "watch",
};

export const MOCK_GOALS: ParticipantGoal[] = [
  {
    id: "goal-1",
    domain: "Daily living",
    summary: "Build confidence attending community appointments",
    progressPercent: 45,
  },
  {
    id: "goal-2",
    domain: "Health",
    summary: "Maintain physiotherapy routine with reliable transport",
    progressPercent: 60,
  },
];

export const MOCK_CONSENT: ConsentSummary = {
  records: [
    { scope: "profile_sharing", status: "granted", lastUsedAt: "2026-05-10" },
    { scope: "transport_sharing", status: "granted", expiresAt: "2026-08-01" },
    { scope: "billing_plan_manager", status: "granted" },
    { scope: "medical_documents", status: "denied" },
  ],
  openConflicts: [],
};

export const MOCK_UPCOMING_EVENTS: ServiceEventSummary[] = [
  {
    id: "evt-1",
    type: "care_transport_bundle",
    status: "needs_confirmation",
    scheduledAt: "2026-05-27T09:00:00+10:00",
    title: "Physio — care + wheelchair transport",
    consentStatus: "granted",
    supportLogStatus: "missing",
    evidenceStatus: "none",
  },
];

export const MOCK_OPEN_RISKS: OpenRiskSummary[] = [
  {
    id: "risk-1",
    level: "watch",
    label: "Manual handling noted for transfers — review may be required",
  },
];

export const MOCK_MISSING_EVIDENCE = [
  "Support log not signed for last transport trip",
];

export function getMockParticipantIds(): string[] {
  return [MOCK_PARTICIPANT_ID];
}

export function isMockParticipant(participantId: string): boolean {
  return participantId === MOCK_PARTICIPANT_ID;
}

export function getMockNdisPlanSummary(participantId: string): NdisPlanSummary | null {
  if (!isMockParticipant(participantId)) {
    return {
      planId: "plan-unknown",
      status: "unknown",
      fundingManagement: "unknown",
      categoryCount: 0,
      overallBudgetBand: "watch",
    };
  }
  return MOCK_PLAN;
}
