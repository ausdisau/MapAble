import { missionCopilotConfig } from "@/lib/config/mission-copilot";
import type { GoldenJourneyState } from "@/lib/pilot/starting-work/golden-journey";
import {
  diffMissionProjections,
  getServiceStandardForMission,
  projectStartingWorkMission,
  type SharedMissionProjection,
} from "@/lib/platform/mission-portfolio";

import type { MissionCopilotQuestion, MissionCopilotResponse } from "./types";

const FORBIDDEN = [
  "book",
  "cancel",
  "reschedule",
  "assign",
  "send",
  "accept",
  "approve",
  "pay",
  "claim",
  "modify consent",
  "modify passport",
  "modify mission",
] as const;

function cite(projection: SharedMissionProjection, depId: string) {
  const dep = projection.dependencies.find((d) => d.id === depId || d.domain === depId);
  return dep
    ? {
        sourceEntityType: dep.domain,
        sourceEntityId: dep.id,
        sourceVersion: null,
        organisationScope: projection.organisationScope,
        participantScope: projection.participantScope,
        consentOrAuthorityBasis: "mission_copilot_read_only",
        purpose: "explain_mission_status",
        dataClassification: "operational" as const,
        freshness: "unknown" as const,
        provenance: "system_record" as const,
        disputed: dep.state === "disputed",
        redactionState: "none" as const,
        permittedAudience: ["participant", "coordinator"],
        retrievalTimestamp: projection.retrievedAt,
        citationLabel: dep.label,
      }
    : null;
}

export function answerMissionQuestion(input: {
  question: MissionCopilotQuestion;
  journey: GoldenJourneyState;
  previousProjection?: SharedMissionProjection | null;
}): MissionCopilotResponse | { disabled: true; reason: string } {
  if (!missionCopilotConfig.enabled) {
    return { disabled: true, reason: "MAPABLE_MISSION_COPILOT_ENABLED is false" };
  }

  // Force portfolio projection path for this vertical slice.
  const priorPortfolio = process.env.MAPABLE_MISSION_PORTFOLIO_ENABLED;
  process.env.MAPABLE_MISSION_PORTFOLIO_ENABLED = "true";
  process.env.MAPABLE_WHAT_CHANGED_ENABLED = "true";
  process.env.MAPABLE_SERVICE_STANDARD_ENABLED = "true";
  const projection = projectStartingWorkMission(input.journey);
  if (priorPortfolio !== undefined) {
    process.env.MAPABLE_MISSION_PORTFOLIO_ENABLED = priorPortfolio;
  }
  if (!projection) {
    return { disabled: true, reason: "Mission projection unavailable" };
  }

  const changes = diffMissionProjections(
    input.previousProjection ?? null,
    projection
  );
  const standards = getServiceStandardForMission("mission.starting_work");

  const worker = projection.dependencies.find((d) => d.domain === "worker_readiness");
  const vehicle = projection.dependencies.find(
    (d) => d.domain === "transport_trip" || d.domain === "transport_quote"
  );
  const passport = projection.dependencies.find(
    (d) => d.domain === "communication_passport"
  );
  const blocked = projection.dependencies.filter((d) => d.blocksMission);

  let directResponse = "";
  let easyRead: string | undefined;
  let checklist: string[] | undefined;
  let providerQuestions: string[] | undefined;
  const confirmed = projection.dependencies
    .filter((d) => d.state === "confirmed" || d.state === "complete")
    .map((d) => d.label);
  const unknown = projection.unknowns;
  const disputed = projection.disputed;
  const citations = projection.dependencies
    .map((d) => cite(projection, d.id))
    .filter(Boolean);

  switch (input.question) {
    case "what_happens_next":
      directResponse = projection.nextStep
        ? `Next: ${projection.nextStep}.`
        : "No open next step is listed on the current projection.";
      break;
    case "what_changed":
      directResponse =
        changes.length === 0
          ? "No dependency state changes were detected since the previous snapshot."
          : changes
              .map((c) => `${c.label}: ${c.fromState} → ${c.toState}`)
              .join("; ");
      break;
    case "what_remains_unknown":
      directResponse =
        unknown.length > 0
          ? `Unknown items: ${unknown.join("; ")}`
          : "No unknowns are listed on the current projection.";
      break;
    case "is_worker_ready":
      directResponse = worker
        ? `Worker readiness state: ${worker.state}. Responsible: ${worker.responsibleParty}.`
        : "Worker readiness is missing from the projection (unknown).";
      break;
    case "is_vehicle_confirmed":
      directResponse = vehicle
        ? `Transport state: ${vehicle.state}. Responsible: ${vehicle.responsibleParty}.`
        : "Vehicle/transport confirmation is unknown on this projection.";
      break;
    case "passport_acknowledged":
      directResponse = passport
        ? `Communication Passport dependency state: ${passport.state}.`
        : "Communication Passport acknowledgement is unknown.";
      break;
    case "what_is_blocked":
      directResponse =
        blocked.length > 0
          ? `Blocked: ${blocked.map((b) => b.label).join("; ")}`
          : "No blocking dependencies are listed.";
      break;
    case "what_needs_my_decision":
      directResponse =
        projection.decisionsRequired.length > 0
          ? projection.decisionsRequired.join(" ")
          : "No participant decisions are currently listed.";
      break;
    case "who_is_responsible":
      directResponse = projection.dependencies
        .filter((d) => d.state !== "confirmed" && d.state !== "complete")
        .map((d) => `${d.label}: ${d.responsibleParty}`)
        .join("; ") || "All listed dependencies look confirmed.";
      break;
    case "what_evidence_supports_this":
      directResponse = `Projection retrieved at ${projection.retrievedAt}. Service standard signals: ${standards
        .map((s) => s.measurableSignal)
        .join("; ")}.`;
      break;
    case "what_if_dependency_fails":
      directResponse =
        "If a dependency fails, the journey blocks and recovery stays with deterministic MapAble services after your decision. This copilot does not execute recovery.";
      checklist = [
        "Identify the failed dependency",
        "Review unknowns and disputed items",
        "Choose an option presented by care/transport services",
        "Confirm only after participant or authorised human approval",
      ];
      break;
    case "easy_read":
      easyRead = [
        "This is your Starting Work journey.",
        projection.nextStep ? `Next step: ${projection.nextStep}.` : "No next step listed.",
        blocked.length
          ? `Something is blocked: ${blocked.map((b) => b.label).join(", ")}.`
          : "Nothing is blocked right now.",
        "MapAble has not taken any action for you.",
      ].join(" ");
      directResponse = easyRead;
      break;
    case "prepare_provider_questions":
      providerQuestions = [
        "Has my Communication Passport been acknowledged?",
        "Is the worker ready for this visit, and what evidence was checked?",
        "Is the vehicle confirmed as accessible for my needs?",
        "What happens if the lift or entrance is unavailable?",
        ...projection.decisionsRequired.map((d) => `About my decision: ${d}`),
      ];
      directResponse = "Draft questions for your provider (not sent):";
      break;
    default: {
      const _exhaustive: never = input.question;
      return { disabled: true, reason: `Unknown question: ${_exhaustive}` };
    }
  }

  return {
    directResponse,
    parts: [
      {
        text: directResponse,
        provenance: "system_record",
        citations: citations as NonNullable<ReturnType<typeof cite>>[],
      },
    ],
    confirmed,
    unknown,
    disputed,
    suggestedNextQuestions: [
      "What remains unknown?",
      "What needs my decision?",
      "Explain this in Easy Read.",
    ],
    actionTaken: false,
    authorityCeiling: "READ_ONLY_EXPLAIN",
    easyRead,
    checklist,
    providerQuestions,
  };
}

export function missionCopilotGuardrails(): {
  authorityCeiling: "READ_ONLY_EXPLAIN";
  forbiddenActions: readonly string[];
  modelRequired: false;
} {
  return {
    authorityCeiling: missionCopilotConfig.authorityCeiling,
    forbiddenActions: FORBIDDEN,
    modelRequired: false,
  };
}
