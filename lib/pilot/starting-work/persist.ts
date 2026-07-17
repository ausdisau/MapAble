import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isStartingWorkDbPersistenceEnabled } from "@/lib/config/starting-work-pilot";
import { prisma } from "@/lib/prisma";
import type { GoldenJourneyState } from "@/lib/pilot/starting-work/golden-journey";
import {
  buildStartingWorkDependencyGraph,
  buildStateHonesty,
} from "@/lib/pilot/starting-work/dependency-graph";
import { issueOutcomeReceipt } from "@/lib/outcomes/ledger";

export function isStartingWorkDbPersistEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    isStartingWorkDbPersistenceEnabled(env) ||
    (env.MAPABLE_STARTING_WORK_PILOT_ENABLED === "true" &&
      env.MAPABLE_STARTING_WORK_DB_PERSISTENCE_ENABLED === "1")
  );
}

const PARTICIPANT_GOAL =
  "Start new job at Harbour Civic Centre with accessible support";

function deriveStatus(state: GoldenJourneyState): string {
  if (state.blocked) return "blocked";
  if (state.stepsCompleted.includes("accountability_preserved")) {
    return "completed_synthetic";
  }
  if (state.stepsCompleted.includes("continuity_opened")) {
    return "recovery_required";
  }
  return "in_progress";
}

/**
 * Persist Starting Work projection. Does not write Care/Transport/Billing domain tables.
 */
export async function persistStartingWorkJourney(input: {
  state: GoldenJourneyState;
  actorUserId?: string | null;
}): Promise<{ projectionId: string; journeyId: string; durable: true } | null> {
  if (!isStartingWorkDbPersistEnabled()) {
    return null;
  }

  const { state } = input;
  const dependencyGraph = buildStartingWorkDependencyGraph(state);
  const stateHonesty = buildStateHonesty(state);
  const currentStep =
    state.stepsCompleted[state.stepsCompleted.length - 1] ?? null;

  let outcomeReceiptJson: unknown = null;
  if (state.outcomeReceiptId) {
    outcomeReceiptJson = issueOutcomeReceipt({
      participantId: "taylor-synthetic",
      goalStatement: PARTICIPANT_GOAL,
      serviceEvidenceRefs: ["care_event_1", "transport_trip_1"],
      finalOutcome: state.blocked
        ? undefined
        : "Employment day started with supports in place",
      participantDeclinedReview:
        state.failureMode === "participant_declines_outcome_review",
    });
  }

  const entityRefsJson = {
    careRequestId: "synthetic:care:request",
    transportQuoteId: "synthetic:transport:quote",
    transportTripId: "synthetic:transport:trip",
    billingServiceRecordId: "synthetic:billing:service_record",
    accessCastForecastId: "synthetic:accesscast:harbour",
    visitPackId: "synthetic:visit_pack:taylor",
    notice:
      "Entity refs are synthetic fixtures — canonical Care/Transport/Billing writers were not invoked for live records",
  };

  const row = await prisma.startingWorkJourneyProjection.upsert({
    where: { journeyId: state.journeyId },
    create: {
      journeyId: state.journeyId,
      participantLabel: state.participantLabel,
      venueLabel: state.venueLabel,
      participantGoal: PARTICIPANT_GOAL,
      status: deriveStatus(state),
      blocked: state.blocked,
      blockReason: state.blockReason ?? null,
      failureMode: state.failureMode ?? null,
      currentStep,
      stepsCompletedJson: state.stepsCompleted,
      dependencyGraphJson: dependencyGraph,
      stateHonestyJson: stateHonesty,
      noticesJson: state.notices,
      readinessJson: state.readiness ?? undefined,
      outcomeReceiptJson: outcomeReceiptJson ?? undefined,
      regionalCandidatesJson: state.regionalCandidates,
      regionalConfirmedJson: state.regionalConfirmed,
      entityRefsJson,
      actorUserId: input.actorUserId ?? null,
      synthetic: true,
      productionClaim: "none",
    },
    update: {
      status: deriveStatus(state),
      blocked: state.blocked,
      blockReason: state.blockReason ?? null,
      failureMode: state.failureMode ?? null,
      currentStep,
      stepsCompletedJson: state.stepsCompleted,
      dependencyGraphJson: dependencyGraph,
      stateHonestyJson: stateHonesty,
      noticesJson: state.notices,
      readinessJson: state.readiness ?? undefined,
      outcomeReceiptJson: outcomeReceiptJson ?? undefined,
      regionalCandidatesJson: state.regionalCandidates,
      regionalConfirmedJson: state.regionalConfirmed,
      entityRefsJson,
      actorUserId: input.actorUserId ?? null,
    },
  });

  await prisma.startingWorkJourneyEvent.create({
    data: {
      projectionId: row.id,
      eventType: state.blocked ? "journey.blocked" : "journey.persisted",
      stepId: currentStep,
      payloadJson: {
        failureMode: state.failureMode ?? null,
        stepsCompleted: state.stepsCompleted.length,
        regionalConfirmedEmpty: state.regionalConfirmed.length === 0,
        autoAssignment: false,
      },
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "starting_work.journey.persisted",
    entityType: "StartingWorkJourneyProjection",
    entityId: row.id,
    metadata: {
      journeyId: state.journeyId,
      status: row.status,
      blocked: state.blocked,
      failureMode: state.failureMode ?? null,
      synthetic: true,
      productionClaim: "none",
    },
  });

  return {
    projectionId: row.id,
    journeyId: state.journeyId,
    durable: true,
  };
}

export async function getStartingWorkProjection(journeyId: string) {
  if (!isStartingWorkDbPersistEnabled()) return null;
  return prisma.startingWorkJourneyProjection.findUnique({
    where: { journeyId },
    include: { events: { orderBy: { createdAt: "asc" }, take: 50 } },
  });
}
