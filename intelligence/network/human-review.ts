import { randomUUID } from "node:crypto";

import type {
  CareOSContinuityAlert,
  CareOSHumanReviewItem,
  CareOSMissionNode,
} from "./types";

function dueAt(severity: CareOSContinuityAlert["severity"]): string {
  const hours = severity === "urgent" ? 4 : severity === "attention" ? 24 : 72;
  return new Date(Date.now() + hours * 60 * 60_000).toISOString();
}

export function buildCareOSHumanReviewQueue(params: {
  requestId: string;
  participantId: string;
  alerts: CareOSContinuityAlert[];
  nodes: CareOSMissionNode[];
}): CareOSHumanReviewItem[] {
  return params.alerts
    .filter((alert) => alert.humanReviewRequired)
    .map((alert) => ({
      id: randomUUID(),
      requestId: params.requestId,
      participantId: params.participantId,
      category:
        alert.code === "LINKED_TRANSPORT_MISSING" ||
        alert.code === "TRANSPORT_UNCONFIRMED"
          ? "transport_continuity"
          : alert.code === "ACCESS_EVIDENCE_MISSING"
            ? "access_evidence"
            : alert.code === "CARE_COVERAGE_UNCONFIRMED"
              ? "care_coordination"
              : "general_coordination",
      priority: alert.severity,
      title: alert.title,
      summary: alert.explanation,
      affectedNodeIds: alert.affectedNodeIds,
      recommendedActions: alert.recoveryActions,
      status: "open",
      assignedRole: "support_coordinator",
      dueAt: dueAt(alert.severity),
      participantContactRequired: true,
      evidence: params.nodes
        .filter((node) => alert.affectedNodeIds.includes(node.id))
        .flatMap((node) => node.evidence),
    }));
}
