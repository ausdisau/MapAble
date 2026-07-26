import { NextResponse } from "next/server";

import { apiForbidden } from "@/lib/auth/guards";
import { withAuthorization } from "@/lib/auth/withAuthorization";
import { buildCopilotContext } from "@/lib/copilot/contextBuilder";
import {
  assertCanAccessParticipantData,
  ParticipantAccessError,
} from "@/lib/prms/participant-access";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Participant context for PRMS / copilot.
 * Requires the participant themself or an authorized care-adjacent role;
 * resource-level consent checks remain in `assertCanAccessParticipantData`.
 */
export const GET = withAuthorization(
  {
    roles: [
      "PARTICIPANT",
      "participant",
      "FAMILY",
      "family_member",
      "SUPPORT_COORDINATOR",
      "support_coordinator",
      "SUPPORT_WORKER",
      "support_worker",
      "PROVIDER",
      "provider_admin",
      "ADMIN",
      "mapable_admin",
    ],
    authorize: async (user, _request, context) => {
      const { id } = await (context as RouteParams).params;
      try {
        await assertCanAccessParticipantData(user, id);
        return true;
      } catch (e) {
        if (e instanceof ParticipantAccessError) {
          return apiForbidden(e.message);
        }
        throw e;
      }
    },
  },
  async (_request, context) => {
    const { id } = await (context as RouteParams).params;
    const ctx = await buildCopilotContext(id);

    if (!ctx) {
      return NextResponse.json(
        {
          error:
            "Participant context not found. Sign in or check your account.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      profileSummary: {
        participantId: ctx.participantId,
        profileCompletionPercent: ctx.profileCompletionPercent,
        accessNeeds: ctx.accessNeeds,
        mobilityAids: ctx.mobilityAids,
        communicationPreferences: ctx.communicationPreferences,
      },
      planSummary: ctx.planSummary,
      consentSummary: ctx.consentSummary,
      upcomingEvents: ctx.upcomingEvents,
      openRisks: ctx.openRisks,
      missingEvidence: ctx.missingEvidence,
      activeGoals: ctx.activeGoals,
    });
  },
);
