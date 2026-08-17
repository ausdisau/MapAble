import type {
  CareOSContinuityAlert,
  CareOSMissionNode,
  CareOSModuleReadResult,
  CareOSNetworkResponse,
  CareOSRecommendation,
} from "./types";

function routeForAlert(alert: CareOSContinuityAlert): string {
  switch (alert.code) {
    case "APPOINTMENT_NOT_FOUND":
      return "/dashboard/calendar";
    case "CARE_COVERAGE_UNCONFIRMED":
    case "LINKED_TRANSPORT_MISSING":
      return "/care/bookings";
    case "TRANSPORT_UNCONFIRMED":
      return "/dashboard/transport/new";
    case "ACCESS_EVIDENCE_MISSING":
      return "/access";
    default:
      return "/dashboard";
  }
}

export function buildCareOSRecommendations(
  alerts: CareOSContinuityAlert[],
): CareOSRecommendation[] {
  if (alerts.length === 0) {
    return [
      {
        id: "review-ready-mission",
        priority: 5,
        title: "Review the coordinated mission",
        explanation:
          "CareOS found no obvious missing dependency in the authorised records. Live availability and final service details still require participant review.",
        agentIds: ["manager", "participant_advocate", "continuity"],
        affectedNodeIds: ["mission-goal"],
        nextAction: {
          label: "Review the standard dashboard",
          href: "/dashboard",
          authorityLevel: "L0_INFORMATION",
        },
      },
    ];
  }

  const severityWeight = { urgent: 3, attention: 2, information: 1 } as const;
  return alerts
    .slice()
    .sort(
      (left, right) =>
        severityWeight[right.severity] - severityWeight[left.severity],
    )
    .map((alert, index) => ({
      id: `recommendation-${alert.id}`,
      priority: Math.max(
        1,
        Math.min(10, alert.severity === "urgent" ? 10 : 8 - index),
      ),
      title: alert.title,
      explanation: `${alert.explanation} ${
        alert.recoveryActions[0] ?? "Review this dependency."
      }`,
      agentIds:
        alert.code === "ACCESS_EVIDENCE_MISSING"
          ? ["manager", "participant_advocate", "access_evidence", "continuity"]
          : alert.code === "TRANSPORT_UNCONFIRMED" ||
              alert.code === "LINKED_TRANSPORT_MISSING"
            ? [
                "manager",
                "participant_advocate",
                "transport_coordination",
                "continuity",
              ]
            : alert.code === "CARE_COVERAGE_UNCONFIRMED"
              ? [
                  "manager",
                  "participant_advocate",
                  "care_coordination",
                  "continuity",
                ]
              : ["manager", "participant_advocate", "continuity"],
      affectedNodeIds: alert.affectedNodeIds,
      nextAction: {
        label: alert.recoveryActions[0] ?? "Review this dependency",
        href: routeForAlert(alert),
        authorityLevel: alert.humanReviewRequired
          ? "L2_RECOMMEND"
          : "L1_DRAFT",
      },
    }));
}

export function deriveCareOSResponseStatus(params: {
  results: CareOSModuleReadResult[];
  alerts: CareOSContinuityAlert[];
  profileNode: CareOSMissionNode | null;
}): CareOSNetworkResponse["status"] {
  if (params.alerts.some((alert) => alert.humanReviewRequired)) {
    return "human_review_required";
  }
  if (
    params.profileNode &&
    !["available", "confirmed"].includes(params.profileNode.status)
  ) {
    return "needs_information";
  }
  if (
    params.results.some((result) =>
      [
        "empty",
        "not_authorised",
        "consent_required",
        "unavailable",
      ].includes(result.status),
    )
  ) {
    return "needs_information";
  }
  return "ready";
}
