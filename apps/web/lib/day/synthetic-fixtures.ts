import type { DayActivity, DayPlan } from "./day-planner";

export const MAPABLE_DAY_SCENARIOS = [
  { id: "baseline", label: "Planned day" },
  { id: "worker_cancelled", label: "Worker cancels" },
  { id: "transport_issue", label: "Transport mismatch" },
  { id: "aac_unconfirmed", label: "Communication not confirmed" },
  { id: "no_verified_worker", label: "No verified worker" },
] as const;

export type MapAbleDayScenarioId = (typeof MAPABLE_DAY_SCENARIOS)[number]["id"];

const STARTING_ACTIVITIES: DayActivity[] = [
  {
    id: "morning-care",
    startTime: "08:00",
    endTime: "09:00",
    title: "Morning personal support",
    detail: "Example support shift. Worker details are fictional.",
    kind: "care",
    status: "confirmed",
    dependsOn: [],
    workerEvidence: "verified",
    vehicleEvidence: "not_applicable",
    requiresAACAcknowledgement: true,
  },
  {
    id: "outbound-trip",
    startTime: "09:15",
    endTime: "09:45",
    title: "Accessible transport to appointment",
    detail: "Pickup depends on the morning support arrangement.",
    kind: "transport",
    status: "confirmed",
    dependsOn: ["morning-care"],
    workerEvidence: "not_applicable",
    vehicleEvidence: "compatible",
    requiresAACAcknowledgement: false,
  },
  {
    id: "appointment",
    startTime: "10:00",
    endTime: "11:00",
    title: "Allied-health appointment",
    detail: "The appointment depends on suitable transport arriving.",
    kind: "appointment",
    status: "confirmed",
    dependsOn: ["outbound-trip"],
    workerEvidence: "not_applicable",
    vehicleEvidence: "not_applicable",
    requiresAACAcknowledgement: false,
  },
  {
    id: "return-trip",
    startTime: "11:15",
    endTime: "11:45",
    title: "Return transport",
    detail: "Return arrangements depend on the appointment.",
    kind: "transport",
    status: "confirmed",
    dependsOn: ["appointment"],
    workerEvidence: "not_applicable",
    vehicleEvidence: "compatible",
    requiresAACAcknowledgement: false,
  },
  {
    id: "lunch",
    startTime: "12:30",
    endTime: "13:00",
    title: "Lunch and personal time",
    detail: "A personal routine, not a worker assignment.",
    kind: "personal",
    status: "confirmed",
    dependsOn: [],
    workerEvidence: "not_applicable",
    vehicleEvidence: "not_applicable",
    requiresAACAcknowledgement: false,
  },
  {
    id: "community",
    startTime: "14:00",
    endTime: "15:00",
    title: "Community participation",
    detail: "An optional local activity. Time and access are still to be checked.",
    kind: "participation",
    status: "pending",
    dependsOn: [],
    workerEvidence: "not_applicable",
    vehicleEvidence: "not_applicable",
    requiresAACAcknowledgement: false,
  },
  {
    id: "evening-care",
    startTime: "17:30",
    endTime: "18:00",
    title: "Evening support check-in",
    detail: "Example separate support shift.",
    kind: "care",
    status: "confirmed",
    dependsOn: [],
    workerEvidence: "verified",
    vehicleEvidence: "not_applicable",
    requiresAACAcknowledgement: false,
  },
];

const scenarioDescriptions: Record<MapAbleDayScenarioId, string> = {
  baseline: "A typical example day with one participation activity still awaiting confirmation.",
  worker_cancelled:
    "The morning worker cancels. Dependent transport and appointment activities become blocked until the person chooses what to do.",
  transport_issue:
    "A proposed vehicle does not meet access requirements. Later activities cannot be marked ready.",
  aac_unconfirmed:
    "The morning worker has not acknowledged the participant's required communication method.",
  no_verified_worker:
    "No eligible backup worker is verified. The system must escalate, not invent a match.",
};

/** No real participant, worker, transport, health or location data. */
export function makeSyntheticDayPlan(scenarioId: MapAbleDayScenarioId): DayPlan {
  const activities = STARTING_ACTIVITIES.map((item) => ({
    ...item,
    dependsOn: [...item.dependsOn],
  }));
  const morning = activities.find((item) => item.id === "morning-care");
  const outbound = activities.find((item) => item.id === "outbound-trip");

  if (scenarioId === "worker_cancelled" && morning) morning.status = "cancelled";
  if (scenarioId === "transport_issue" && outbound) {
    outbound.vehicleEvidence = "incompatible";
  }
  if (scenarioId === "no_verified_worker" && morning) {
    morning.status = "unknown";
    morning.workerEvidence = "unverified";
  }

  return {
    scenarioId,
    description: scenarioDescriptions[scenarioId],
    activities,
    communication: {
      preferredMode: "Text and AAC, with adequate response time",
      workerAcknowledged: scenarioId !== "aac_unconfirmed",
    },
    participantControls: {
      changeApprovalRequired: true,
      delegationNotAssumed: true,
      sharingNotGrantedByDefault: true,
    },
    dataSource: "synthetic",
  };
}
