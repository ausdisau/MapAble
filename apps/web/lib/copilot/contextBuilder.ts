import type { CopilotContext } from "@/lib/copilot/types";
import {
  isMockParticipant,
  MOCK_CONSENT,
  MOCK_GOALS,
  MOCK_MISSING_EVIDENCE,
  MOCK_OPEN_RISKS,
  MOCK_PLAN,
  MOCK_PROFILE,
  MOCK_UPCOMING_EVENTS,
} from "@/lib/prms/mockPrmsData";

/**
 * Builds a privacy-scoped context object for Co-Pilot.
 * Does not expose raw NDIS numbers, free-text case notes, or incident narratives
 * unless the active workflow is incident/safety (handled at route level).
 */
export async function buildCopilotContext(
  participantId: string
): Promise<CopilotContext | null> {
  if (!isMockParticipant(participantId)) {
    return null;
  }

  const grantedScopes = MOCK_CONSENT.records
    .filter((r) => r.status === "granted")
    .map((r) => r.scope);

  return {
    participantId,
    profileCompletionPercent: MOCK_PROFILE.profileCompletionPercent,
    accessNeeds: MOCK_PROFILE.accessNeeds.map((a) => ({
      id: a.id,
      label: a.label,
    })),
    mobilityAids: MOCK_PROFILE.mobilityAids.map((m) => ({
      id: m.id,
      label: m.label,
    })),
    communicationPreferences: MOCK_PROFILE.communicationPreferences.map((c) => ({
      id: c.id,
      mode: c.mode,
    })),
    planSummary: {
      status: MOCK_PLAN.status,
      fundingManagement: MOCK_PLAN.fundingManagement,
      overallBudgetBand: MOCK_PLAN.overallBudgetBand,
    },
    activeGoals: MOCK_GOALS.map((g) => ({
      id: g.id,
      summary: g.summary,
    })),
    consentSummary: {
      grantedScopes,
      openConsentConflicts: MOCK_CONSENT.openConflicts,
    },
    upcomingEvents: MOCK_UPCOMING_EVENTS.map((e) => ({
      id: e.id,
      title: e.title,
      scheduledAt: e.scheduledAt,
    })),
    openRisks: MOCK_OPEN_RISKS.map((r) => ({
      id: r.id,
      level: r.level,
      label: r.label,
    })),
    missingEvidence: [...MOCK_MISSING_EVIDENCE],
  };
}
