/**
 * MapAble Day v0.1: deterministic, synthetic-only planning domain.
 *
 * No network calls, identity authority, service bookings, worker matching,
 * clinical instructions, or autonomous actions belong in this module.
 */

export type DayActivityKind =
  | "care"
  | "transport"
  | "appointment"
  | "participation"
  | "personal";

export type DayActivityStatus = "confirmed" | "pending" | "unknown" | "cancelled";
export type DayReadiness = "ready" | "review" | "blocked";
export type WorkerEvidence = "verified" | "unverified" | "not_applicable";
export type VehicleEvidence = "compatible" | "unknown" | "incompatible" | "not_applicable";

export type DayActivity = {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  detail: string;
  kind: DayActivityKind;
  status: DayActivityStatus;
  dependsOn: string[];
  workerEvidence: WorkerEvidence;
  vehicleEvidence: VehicleEvidence;
  requiresAACAcknowledgement: boolean;
};

export type DayPlan = {
  scenarioId: string;
  description: string;
  activities: DayActivity[];
  communication: {
    preferredMode: string;
    workerAcknowledged: boolean;
  };
  participantControls: {
    changeApprovalRequired: true;
    delegationNotAssumed: true;
    sharingNotGrantedByDefault: true;
  };
  dataSource: "synthetic";
};

export type DayActivityAssessment = {
  activityId: string;
  readiness: DayReadiness;
  reasons: string[];
  affectedBy: string[];
};

export type DayPlanAssessment = {
  activities: DayActivityAssessment[];
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  humanReviewRequired: boolean;
  allConfirmedAndReady: boolean;
};

export type DayRecoveryProposal = {
  id: string;
  label: string;
  detail: string;
  requiresParticipantConfirmation: true;
  autoAssignsWorkerOrTransport: false;
  changesExternalRecords: false;
};

const priority: Record<DayReadiness, number> = {
  ready: 0,
  review: 1,
  blocked: 2,
};

function highest(a: DayReadiness, b: DayReadiness): DayReadiness {
  return priority[a] >= priority[b] ? a : b;
}

/**
 * Evaluate the actual dependency graph, not just a checklist.
 * Unknown is not equivalent to cancelled. A blocked dependency propagates
 * downstream, while unrelated activities remain untouched.
 */
export function assessDayPlan(plan: DayPlan): DayPlanAssessment {
  const byId = new Map(plan.activities.map((item) => [item.id, item]));
  const cache = new Map<string, DayActivityAssessment>();

  function visit(id: string, ancestors: Set<string>): DayActivityAssessment {
    const previously = cache.get(id);
    if (previously) return previously;

    if (ancestors.has(id)) {
      return {
        activityId: id,
        readiness: "blocked",
        reasons: ["The plan contains a circular dependency and needs human review."],
        affectedBy: [id],
      };
    }

    const item = byId.get(id);
    if (!item) {
      return {
        activityId: id,
        readiness: "blocked",
        reasons: ["A required activity is missing from this plan."],
        affectedBy: [id],
      };
    }

    const reasons: string[] = [];
    const affectedBy: string[] = [];
    let readiness: DayReadiness = "ready";

    if (item.status === "cancelled") {
      readiness = "blocked";
      reasons.push("This arrangement has been cancelled.");
    } else if (item.status === "pending") {
      readiness = "review";
      reasons.push("This arrangement is awaiting confirmation.");
    } else if (item.status === "unknown") {
      readiness = "review";
      reasons.push("This arrangement has not been verified.");
    }

    if (item.kind === "care" && item.workerEvidence === "unverified") {
      readiness = "blocked";
      reasons.push("A suitable worker has not been verified. Do not assume cover.");
    }

    if (item.kind === "transport" && item.vehicleEvidence === "incompatible") {
      readiness = "blocked";
      reasons.push("The proposed vehicle does not meet the stated access requirements.");
    } else if (item.kind === "transport" && item.vehicleEvidence === "unknown") {
      readiness = highest(readiness, "review");
      reasons.push("Vehicle accessibility has not been checked.");
    }

    if (item.requiresAACAcknowledgement && !plan.communication.workerAcknowledged) {
      readiness = "blocked";
      reasons.push("Required communication access has not been acknowledged.");
    }

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(id);
    for (const dependencyId of item.dependsOn) {
      const dependency = visit(dependencyId, nextAncestors);
      if (dependency.readiness !== "ready") {
        readiness = highest(readiness, dependency.readiness);
        affectedBy.push(dependencyId);
        reasons.push(
          dependency.readiness === "blocked"
            ? "A required preceding activity is blocked."
            : "A required preceding activity needs review.",
        );
      }
    }

    const value: DayActivityAssessment = {
      activityId: id,
      readiness,
      reasons: Array.from(new Set(reasons)),
      affectedBy: Array.from(new Set(affectedBy)),
    };
    cache.set(id, value);
    return value;
  }

  const activities = plan.activities.map((item) => visit(item.id, new Set()));
  const readyCount = activities.filter((a) => a.readiness === "ready").length;
  const reviewCount = activities.filter((a) => a.readiness === "review").length;
  const blockedCount = activities.filter((a) => a.readiness === "blocked").length;
  return {
    activities,
    readyCount,
    reviewCount,
    blockedCount,
    humanReviewRequired: blockedCount > 0,
    allConfirmedAndReady: activities.length > 0 && readyCount === activities.length,
  };
}

/**
 * Options are drafts only. Selection does not change care, transport, or
 * calendar records and never implies that a replacement is available.
 */
export function recoveryProposalsFor(
  activity: DayActivity,
): DayRecoveryProposal[] {
  if (activity.kind === "care") {
    return [
      {
        id: "review-backup",
        label: "Review potential backup workers",
        detail:
          "Ask the existing MapAble Care recovery workflow to check suitability, availability, credentials and communication fit. No replacement is presumed.",
        requiresParticipantConfirmation: true,
        autoAssignsWorkerOrTransport: false,
        changesExternalRecords: false,
      },
      {
        id: "human-coordinator",
        label: "Ask for human coordination",
        detail:
          "A coordinator can discuss alternatives without changing your instructions or choices.",
        requiresParticipantConfirmation: true,
        autoAssignsWorkerOrTransport: false,
        changesExternalRecords: false,
      },
      {
        id: "review-schedule",
        label: "Review changes to today's activities",
        detail:
          "Consider rescheduling or changing the plan only after you approve the proposal.",
        requiresParticipantConfirmation: true,
        autoAssignsWorkerOrTransport: false,
        changesExternalRecords: false,
      },
    ];
  }

  if (activity.kind === "transport") {
    return [
      {
        id: "review-accessible-trip",
        label: "Review accessible transport alternatives",
        detail:
          "Ask the existing transport recovery service to verify vehicle compatibility and availability.",
        requiresParticipantConfirmation: true,
        autoAssignsWorkerOrTransport: false,
        changesExternalRecords: false,
      },
      {
        id: "transport-human-review",
        label: "Request a human transport review",
        detail:
          "Review trip timing, support dependencies and options with an accountable coordinator.",
        requiresParticipantConfirmation: true,
        autoAssignsWorkerOrTransport: false,
        changesExternalRecords: false,
      },
    ];
  }

  return [
    {
      id: "review-dependencies",
      label: "Review this activity and its dependencies",
      detail:
        "Check what has changed and choose whether to keep, move or cancel this activity. No changes are made automatically.",
      requiresParticipantConfirmation: true,
      autoAssignsWorkerOrTransport: false,
      changesExternalRecords: false,
    },
  ];
}
