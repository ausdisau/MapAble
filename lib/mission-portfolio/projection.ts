import { missionPortfolioConfig } from "@/lib/config/mission-portfolio";
import type { GoldenJourneyState } from "@/lib/pilot/starting-work/golden-journey";
import {
  buildStartingWorkDependencyGraph,
  buildStateHonesty,
} from "@/lib/pilot/starting-work/dependency-graph";

import { getMission } from "./registry";
import type {
  MissionDependencyItem,
  MissionDependencyState,
  SharedMissionProjection,
} from "./types";

function mapNodeState(
  state: string
): MissionDependencyState {
  switch (state) {
    case "blocked":
      return "blocked";
    case "confirmed":
    case "accepted":
    case "assigned":
    case "delivered":
    case "reviewed":
    case "invoiced":
    case "outcome_achieved":
      return "confirmed";
    case "disputed":
    case "recovery_required":
      return "disputed";
    case "unknown":
      return "unknown";
    case "not_started":
      return "not_started";
    default:
      return "in_progress";
  }
}

function responsibleFor(kind: string): string {
  switch (kind) {
    case "communication_passport":
      return "Worker / provider (acknowledge)";
    case "worker_readiness":
      return "Provider coordinator";
    case "care_shift":
      return "Provider care ops";
    case "transport_quote":
    case "transport_trip":
    case "return_journey":
      return "Transport provider";
    case "billing_evidence":
      return "Provider billing";
    case "outcome_review":
      return "Participant";
    case "visit_pack":
      return "Companion / coordinator";
    default:
      return "Coordinator";
  }
}

/**
 * Shared mission dependency projection over Starting Work.
 * Read-only — does not write care/transport/billing SoRs.
 */
export function projectStartingWorkMission(
  state: GoldenJourneyState
): SharedMissionProjection | null {
  if (!missionPortfolioConfig.enabled) return null;
  const reg = getMission("mission.starting_work");
  if (!reg) return null;

  const graph =
    state.dependencyGraph ??
    buildStartingWorkDependencyGraph({
      blocked: state.blocked,
      failureMode: state.failureMode,
      stepsCompleted: state.stepsCompleted,
    });
  const honesty =
    state.stateHonesty ??
    buildStateHonesty({
      blocked: state.blocked,
      failureMode: state.failureMode,
      stepsCompleted: state.stepsCompleted,
    });

  const dependencies: MissionDependencyItem[] = graph.nodes.map((n) => ({
    id: n.id,
    label: n.label,
    domain: n.kind,
    state: mapNodeState(n.state),
    responsibleParty: responsibleFor(n.kind),
    evidenceRefs: n.entityRef ? [n.entityRef] : [],
    blocksMission: n.state === "blocked",
  }));

  const unknowns: string[] = [];
  const disputed: string[] = [];
  for (const [key, value] of Object.entries(honesty)) {
    if (value === "unknown" || value === "not_started") {
      unknowns.push(`${key}: ${value}`);
    }
    if (value === "disputed" || value === "blocked") {
      disputed.push(`${key}: ${value}`);
    }
  }

  const blocked = dependencies.filter((d) => d.blocksMission);
  const decisionsRequired: string[] = [];
  if (state.blocked) {
    decisionsRequired.push(
      state.blockReason ?? "Resolve the blocking dependency before continuing."
    );
  }
  if (state.regionalCandidates.length && !state.regionalConfirmed.length) {
    decisionsRequired.push(
      "Participant approval required for regional replacement candidates."
    );
  }

  const nextIncomplete = dependencies.find(
    (d) => d.state === "not_started" || d.state === "in_progress" || d.state === "blocked"
  );

  return {
    missionKey: reg.key,
    missionInstanceId: state.journeyId,
    participantScope: state.participantLabel,
    organisationScope: null,
    goal: state.participantGoal,
    nextStep: nextIncomplete?.label ?? null,
    dependencies,
    unknowns,
    disputed,
    decisionsRequired,
    productionClaim: "none",
    retrievedAt: new Date().toISOString(),
  };
}
