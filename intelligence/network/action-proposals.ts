import { createHash, randomUUID } from "node:crypto";

import type {
  CareOSActionProposal,
  CareOSMissionNode,
  CareOSNetworkRequest,
} from "./types";

function hashPayload(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function expiresAt(minutes = 30): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function proposal(params: Omit<CareOSActionProposal, "id" | "payloadHash" | "expiresAt"> & {
  payload: Record<string, unknown>;
}): CareOSActionProposal {
  return {
    ...params,
    id: randomUUID(),
    payloadHash: hashPayload(params.payload),
    expiresAt: expiresAt(),
  };
}

export function buildCareOSActionProposals(params: {
  requestId: string;
  participantId: string;
  request: CareOSNetworkRequest;
  nodes: CareOSMissionNode[];
}): CareOSActionProposal[] {
  const proposals: CareOSActionProposal[] = [];
  const careNode = params.nodes.find((node) => node.id === "mission-care");
  const transportNode = params.nodes.find((node) => node.id === "mission-transport");

  if (params.request.modules.includes("care") && careNode?.status !== "disabled") {
    proposals.push(
      proposal({
        requestId: params.requestId,
        participantId: params.participantId,
        actionType: "submit_care_request",
        title: "Prepare a care support request",
        summary:
          "Create a draft request for appointment-related support. Nothing will be submitted until you review and confirm it.",
        status: "draft",
        authorityLevel: "L3_CONFIRMED_ACTION",
        requiredApprovals: ["participant"],
        informationToShare: ["goal", "appointment timing", "support requirements"],
        estimatedCost: null,
        cancellationTerms: null,
        payload: {
          goal: params.request.goal,
          sourceNodeId: careNode?.id ?? null,
        },
      })
    );
  }

  if (
    params.request.modules.includes("transport") &&
    transportNode?.status !== "disabled"
  ) {
    proposals.push(
      proposal({
        requestId: params.requestId,
        participantId: params.participantId,
        actionType: "submit_transport_request",
        title: "Prepare an accessible transport request",
        summary:
          "Create a draft transport request linked to this mission. Vehicle availability and final pricing still require confirmation.",
        status: "draft",
        authorityLevel: "L3_CONFIRMED_ACTION",
        requiredApprovals: ["participant"],
        informationToShare: ["pickup and destination", "appointment timing", "mobility requirements"],
        estimatedCost: null,
        cancellationTerms: "Operator cancellation terms must be shown before execution.",
        payload: {
          goal: params.request.goal,
          sourceNodeId: transportNode?.id ?? null,
        },
      })
    );
  }

  return proposals;
}
