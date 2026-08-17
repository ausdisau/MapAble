import { randomUUID } from "node:crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";

import { getMapAbleIntelligenceConfig } from "../config";
import { buildSessionConsent } from "../consent/session-consent";
import { persistCareOSMission } from "../operations/mission-state-service";
import type { MapAbleModule } from "../types";

import { buildCareOSActionProposals } from "./action-proposals";
import { selectCareOSAgentNetwork } from "./agent-registry";
import { analyseCareOSContinuity } from "./continuity-radar";
import { buildCareOSHumanReviewQueue } from "./human-review";
import { buildCareOSMissionGraph } from "./mission-graph";
import {
  readCareOSAccessibilityProfile,
  readCareOSModules,
} from "./module-reader";
import {
  buildCareOSRecommendations,
  deriveCareOSResponseStatus,
} from "./recommendations";
import type {
  CareOSNetworkRequest,
  CareOSNetworkResponse,
} from "./types";

export async function buildCareOSAgenticNetwork(params: {
  user: CurrentUser;
  request: CareOSNetworkRequest;
}): Promise<CareOSNetworkResponse> {
  const config = getMapAbleIntelligenceConfig();
  const requestId = randomUUID();
  const modules = [
    ...new Set<MapAbleModule>(["core", ...params.request.modules]),
  ];
  const consentScopes = buildSessionConsent({
    modules,
    includeAccessibilityProfile:
      params.request.includeAccessibilityProfile,
  });

  const [results, profileNode] = await Promise.all([
    readCareOSModules({ modules, user: params.user, consentScopes }),
    readCareOSAccessibilityProfile({
      requested: params.request.includeAccessibilityProfile,
      user: params.user,
      consentScopes,
    }),
  ]);

  const mission = buildCareOSMissionGraph({
    goal: params.request.goal,
    results,
  });
  if (profileNode) {
    mission.nodes.push(profileNode);
    mission.edges.push({
      from: "mission-transport",
      to: profileNode.id,
      relationship: "validated_by",
    });
  }

  const continuityEnabled =
    config.continuityRadarEnabled &&
    params.request.includeContinuityAnalysis;
  const continuityAlerts = continuityEnabled
    ? analyseCareOSContinuity(mission)
    : [];
  const agents = selectCareOSAgentNetwork({
    modules,
    enabledModules: config.modules,
    includeContinuityAnalysis: continuityEnabled,
  });
  const actionProposals = buildCareOSActionProposals({
    requestId,
    participantId: params.user.id,
    request: params.request,
    nodes: mission.nodes,
  });
  const humanReviewQueue = buildCareOSHumanReviewQueue({
    requestId,
    participantId: params.user.id,
    alerts: continuityAlerts,
    nodes: mission.nodes,
  });

  const response: CareOSNetworkResponse = {
    generatedAt: new Date().toISOString(),
    requestId,
    participantId: params.user.id,
    goal: params.request.goal,
    status: deriveCareOSResponseStatus({
      results,
      alerts: continuityAlerts,
      profileNode,
    }),
    agents,
    mission,
    continuityAlerts,
    recommendations: buildCareOSRecommendations(continuityAlerts),
    actionProposals,
    humanReviewQueue,
    notices: [
      "No action has been executed. Draft proposals require a separate participant confirmation step.",
      "Participant authority, request-scoped consent and standard MapAble services remain in control.",
      "Live provider, worker, vehicle and venue availability must be confirmed through the relevant service.",
      "Robotics remains simulation-only and is not connected to physical actuation.",
    ],
    modelReasoningUsed: false,
    writeActionsEnabled: config.writeActionsEnabled,
    nonAiPath: {
      label: "Open the standard MapAble dashboard",
      href: "/dashboard",
    },
  };

  if (config.careOSPersistenceEnabled) {
    try {
      await persistCareOSMission({
        participantId: params.user.id,
        request: params.request,
        response,
      });
    } catch (error) {
      console.error("[careos-mission-persistence]", error);
      response.notices.push(
        "The mission was prepared but could not be saved to CareOS history.",
      );
    }
  }

  if (config.auditEnabled) {
    await createAuditEvent({
      actorUserId: params.user.id,
      actorRole: params.user.primaryRole,
      participantId: params.user.id,
      action: "careos.network.generated",
      entityType: "CareOSMissionNetwork",
      entityId: requestId,
      metadata: {
        modules,
        statuses: results.map((result) => ({
          module: result.module,
          status: result.status,
          itemCount: result.items.length,
        })),
        profileStatus: profileNode?.status ?? "not_requested",
        activeAgents: agents
          .filter((agent) => agent.status === "active")
          .map((agent) => agent.id),
        alertCodes: continuityAlerts.map((alert) => alert.code),
        proposalTypes: actionProposals.map(
          (proposal) => proposal.actionType,
        ),
        humanReviewCategories: humanReviewQueue.map(
          (item) => item.category,
        ),
        persistenceEnabled: config.careOSPersistenceEnabled,
        writeActionsEnabled: config.writeActionsEnabled,
      },
    });
  }

  return response;
}
