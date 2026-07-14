import type {
  CareOSContinuityAlert,
  CareOSMissionEdge,
  CareOSMissionNode,
} from "./types";

function findNode(nodes: CareOSMissionNode[], id: string): CareOSMissionNode | undefined {
  return nodes.find((node) => node.id === id);
}

function alertForUnavailableNode(node: CareOSMissionNode): CareOSContinuityAlert | null {
  if (node.status === "not_authorised") {
    return {
      id: `not-authorised-${node.id}`,
      severity: "attention",
      code: "MODULE_NOT_AUTHORISED",
      title: `${node.label} was not authorised`,
      explanation:
        "CareOS could not read this part of the mission because the account permission or request-scoped consent was not available.",
      affectedNodeIds: [node.id],
      recoveryActions: [
        "Review the request permissions",
        "Continue through the standard MapAble service",
      ],
      humanReviewRequired: false,
    };
  }

  if (node.status === "disabled") {
    return {
      id: `disabled-${node.id}`,
      severity: "information",
      code: "MODULE_DISABLED",
      title: `${node.label} intelligence is disabled`,
      explanation:
        "The standard MapAble service remains available even though this CareOS module is disabled.",
      affectedNodeIds: [node.id],
      recoveryActions: ["Use the standard MapAble service"],
      humanReviewRequired: false,
    };
  }

  return null;
}

export function analyseCareOSContinuity(params: {
  nodes: CareOSMissionNode[];
  edges: CareOSMissionEdge[];
}): CareOSContinuityAlert[] {
  const alerts: CareOSContinuityAlert[] = [];

  for (const node of params.nodes) {
    const unavailable = alertForUnavailableNode(node);
    if (unavailable) alerts.push(unavailable);
  }

  const appointment = findNode(params.nodes, "mission-appointment");
  const care = findNode(params.nodes, "mission-care");
  const transport = findNode(params.nodes, "mission-transport");
  const access = findNode(params.nodes, "mission-access");

  if (!appointment || appointment.status === "missing" || appointment.status === "needs_review") {
    alerts.push({
      id: "appointment-not-found",
      severity: "attention",
      code: "APPOINTMENT_NOT_FOUND",
      title: "The mission is not anchored to an appointment",
      explanation:
        "CareOS needs a confirmed date, time or activity before it can coordinate care and transport reliably.",
      affectedNodeIds: appointment ? [appointment.id] : [],
      recoveryActions: [
        "Select an upcoming calendar event",
        "Enter the activity date and time manually",
      ],
      humanReviewRequired: false,
    });
  }

  if (!care || care.status === "missing" || care.status === "needs_review") {
    alerts.push({
      id: "care-coverage-unconfirmed",
      severity: "attention",
      code: "CARE_COVERAGE_UNCONFIRMED",
      title: "Care and support coverage is unconfirmed",
      explanation:
        "No current care request was available to confirm who will provide the support required for this mission.",
      affectedNodeIds: care ? [care.id] : [],
      recoveryActions: [
        "Review existing care requests",
        "Prepare a new support request",
        "Ask a human coordinator to verify coverage",
      ],
      humanReviewRequired: false,
    });
  }

  if (!transport || transport.status === "missing" || transport.status === "needs_review") {
    alerts.push({
      id: "transport-unconfirmed",
      severity: "attention",
      code: "TRANSPORT_UNCONFIRMED",
      title: "Accessible transport is unconfirmed",
      explanation:
        "No existing transport record was available for the mission. Vehicle accessibility and live availability have not been verified.",
      affectedNodeIds: transport ? [transport.id] : [],
      recoveryActions: [
        "Open the governed accessible journey planner",
        "Use the standard transport request form",
      ],
      humanReviewRequired: false,
    });
  }

  const linkedTransportRequired = params.edges.some(
    (edge) =>
      edge.from === "mission-care" &&
      edge.to === "mission-transport" &&
      edge.relationship === "depends_on"
  );

  if (
    linkedTransportRequired &&
    (!transport || transport.status !== "available")
  ) {
    alerts.push({
      id: "linked-transport-missing",
      severity: "urgent",
      code: "LINKED_TRANSPORT_MISSING",
      title: "A care request depends on transport that is not confirmed",
      explanation:
        "The current care record indicates that linked transport is required. The mission should not be treated as ready until accessible transport is confirmed.",
      affectedNodeIds: ["mission-care", "mission-transport"],
      recoveryActions: [
        "Prepare a linked accessible journey",
        "Ask a human coordinator to verify both services together",
      ],
      humanReviewRequired: true,
    });
  }

  if (!access || access.status === "missing" || access.status === "needs_review") {
    alerts.push({
      id: "access-evidence-missing",
      severity: "attention",
      code: "ACCESS_EVIDENCE_MISSING",
      title: "Destination accessibility evidence is incomplete",
      explanation:
        "CareOS could not verify the destination against a published MapAble access record. Unknown access must remain unknown rather than being guessed.",
      affectedNodeIds: access ? [access.id] : [],
      recoveryActions: [
        "Review the destination in MapAble Access",
        "Contact the venue",
        "Request human verification",
      ],
      humanReviewRequired: false,
    });
  }

  return alerts;
}
