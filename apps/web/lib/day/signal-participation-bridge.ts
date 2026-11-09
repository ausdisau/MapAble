/**
 * MapAble Day optional preview bridge for a participant-chosen Signal activity.
 * The output is an in-memory synthetic plan only. It never alters Calendar,
 * Care, Transport, AccessPlace, Evidence, ConsentRecord or AuditEvent.
 */
import {
  assertPrivateSignalChoice,
  SignalParticipationError,
  type SignalParticipationChoice,
} from "@/lib/core/signal/participation";
import type { SignalDayAccessProjection } from "@/lib/access/signal/day-evidence-projection";

import type { DayActivity, DayPlan } from "./day-planner";

export const SIGNAL_DAY_ACTIVITY_ID = "signal-mapping-practice";
const DURATION_MINUTES = 45;

const CHALLENGE_TITLES: Record<SignalParticipationChoice["challengeId"], string> = {
  journeys: "Connect the Journey",
  entrances: "Every Entrance Counts",
  facilities: "Essential Access",
  sensory: "Quiet, Clear and Welcoming",
  changes: "Is It Still Accessible?",
};

const MODE_TEXT: Record<SignalParticipationChoice["mode"], string> = {
  remote: "Remote participation, no visit required.",
  field: "In-person participation would require a safe route, accessible event arrangements, permission and independently checked transport if needed.",
  supported: "Participation with a chosen supporter or AAC method; no supporter is assigned or notified.",
};

function minutes(clock: string): number {
  const [hour, minute] = clock.split(":").map(Number);
  return hour * 60 + minute;
}

function laterClock(start: string, durationMinutes: number): string {
  const end = minutes(start) + durationMinutes;
  return String(Math.floor(end / 60)).padStart(2, "0") + ":" +
    String(end % 60).padStart(2, "0");
}

/**
 * Deterministically add a tentative participation item. Readiness stays
 * "review" even for a single assessor-verified feature: not every journey
 * segment, support and communication need has been checked.
 */
export function addSignalPracticeToDay(
  plan: DayPlan,
  choice: SignalParticipationChoice | null,
  access: SignalDayAccessProjection,
): DayPlan {
  if (choice === null) return plan;

  if (plan.dataSource !== "synthetic") {
    throw new SignalParticipationError("Signal can only be added to the synthetic Day preview.");
  }
  assertPrivateSignalChoice(choice);
  if (
    access.publicPublicationAllowed !== false ||
    access.independentWholeJourneyCheck !== false ||
    access.participantFitEstablished !== false ||
    access.productionClaim !== "none" ||
    access.dayReadiness !== "review"
  ) {
    throw new SignalParticipationError("Access findings cannot authorise an entire journey.");
  }

  if (plan.activities.some((item) => item.id === SIGNAL_DAY_ACTIVITY_ID)) {
    throw new SignalParticipationError("The Signal practice activity is already in this plan.");
  }

  const start = choice.startTime;
  const end = laterClock(start, DURATION_MINUTES);
  const startMinute = minutes(start);
  const endMinute = minutes(end);

  if (
    plan.activities.some(
      (item) =>
        item.status !== "cancelled" &&
        startMinute < minutes(item.endTime) &&
        endMinute > minutes(item.startTime),
    )
  ) {
    throw new SignalParticipationError(
      "The selected practice time conflicts with another example activity.",
    );
  }

  const newActivity: DayActivity = {
    id: SIGNAL_DAY_ACTIVITY_ID,
    startTime: start,
    endTime: end,
    title: "MapAble Signal: " + CHALLENGE_TITLES[choice.challengeId],
    detail: [
      "Optional fictional Mapping Challenge — not a scheduled event or booking.",
      MODE_TEXT[choice.mode],
      "Access evidence: " + access.reason,
      "Communication, venue and journey suitability need your own review.",
    ].join(" "),
    kind: "participation",
    status: "pending",
    dependsOn: [],
    workerEvidence: "not_applicable",
    vehicleEvidence: "not_applicable",
    requiresAACAcknowledgement: false,
  };

  return {
    ...plan,
    activities: [...plan.activities, newActivity].sort(
      (a, b) => minutes(a.startTime) - minutes(b.startTime),
    ),
  };
}
