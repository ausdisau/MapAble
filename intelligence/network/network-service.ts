import { randomUUID } from "node:crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";

import { getMapAbleIntelligenceConfig } from "../config";
import { buildSessionConsent } from "../consent/session-consent";
import {
  executeIntelligenceReadTool,
  IntelligenceToolAccessError,
  type IntelligenceToolName,
} from "../tools/registry";
import type { MapAbleModule } from "../types";
import { selectCareOSAgentNetwork } from "./agent-registry";
import { analyseCareOSContinuity } from "./continuity-radar";
import { buildCareOSMissionGraph } from "./mission-graph";
import type {
  CareOSContinuityAlert,
  CareOSNetworkRequest,
  CareOSNetworkResponse,
  CareOSRecommendation,
  CareOSModuleReadResult,
} from "./types";

type ModuleReadSpec = {
  tool?: IntelligenceToolName;
  input?: unknown;
};

const MODULE_READS: Record<MapAbleModule, ModuleReadSpec> = {
  core: { tool: "read_upcoming_appointments", input: { days: 30 } },
  care: { tool: "read_care_requests", input: { limit: 10 } },
  transport: { tool: "read_transport_trips", input: {} },
  jobs: { tool: "read_public_jobs", input: { limit: 5 } },
  access: { tool: "read_access_places", input: { limit: 10 } },
  moves: {},
  foods: {},
  payments: { tool: "read_invoices", input: {} },
};

function normaliseItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

async function readModule(params: {
  module: MapAbleModule;
  user: CurrentUser;
  consentScopes: ReturnType<typeof buildSessionConsent>;
}): Promise<CareOSModuleReadResult> {
  const config = getMapAbleIntelligenceConfig();
  const spec = MODULE_READS[params.module];

  if (!config.modules[params.module]) {
    return { module: params.module, status: "disabled", items: [] };
  }

  if (!spec.tool) {
    return { module: params.module, status: "unavailable", items: [] };
  }

  try {
    const value = await executeIntelligenceReadTool(spec.tool, spec.input ?? {}, {
      user: params.user,
      consentScopes: params.consentScopes,
    });
    const items = normaliseItems(value);
    return {
      module: params.module,
      status: items.length > 0 ? "available" : "empty",
      items,
    };
  } catch (error) {
    if (error instanceof IntelligenceToolAccessError) {
      if (error.code === "PERMISSION_DENIED") {
        return { module: params.module, status: "not_authorised", items: [] };
      }
      if (error.code === "CONSENT_REQUIRED") {
        return { module: params.module, status: "consent_required", items: [] };
      }
    }

    console.error(`[careos-network-${params.module}]`, error);
    return { module: params.module, status: "unavailable", items: [] };
  }
}

function routeForAlert(alert: CareOSContinuityAlert): string | null {
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

function recommendationsFromAlerts(
  alerts: CareOSContinuityAlert[]
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

  return alerts
    .slice()
    .sort((left, right) => {
      const weight = { urgent: 3, attention: 2, information: 1 } as const;
      return weight[right.severity] - weight[left.severity];
    })
    .map((alert, index) => ({
      id: `recommendation-${alert.id}`,
      priority: Math.min(10, alert.severity === "urgent" ? 10 : 8 - index),
      title: alert.title,
      explanation: `${alert.explanation} ${alert.recoveryActions[0] ?? "Review this dependency."}`,
      agentIds:
        alert.code === "ACCESS_EVIDENCE_MISSING"
          ? ["manager", "participant_advocate", "access_evidence", "continuity"]
          : alert.code === "TRANSPORT_UNCONFIRMED" ||
              alert.code === "LINKED_TRANSPORT_MISSING"
            ? ["manager", "participant_advocate", "transport_coordination", "continuity"]
            : alert.code === "CARE_COVERAGE_UNCONFIRMED"
              ? ["manager", "participant_advocate", "care_coordination", "continuity"]
              : ["manager", "participant_advocate", "continuity"],
      affectedNodeIds: alert.affectedNodeIds,
      nextAction: {
        label: alert.recoveryActions[0] ?? "Review this dependency",
        href: routeForAlert(alert),
        authorityLevel: alert.humanReviewRequired ? "L2_RECOMMEND" : "L1_DRAFT",
      },
    }));
}

function responseStatus(
  results: CareOSModuleReadResult[],
  alerts: CareOSContinuityAlert[]
): CareOSNetworkResponse["status"] {
  if (alerts.some((alert) => alert.humanReviewRequired)) {
    return "human_review_required";
  }

  if (
    results.some((result) =>
      ["empty", "not_authorised", "consent_required", "unavailable"].includes(
        result.status
      )
    )
  ) {
    return "needs_information";
  }

  return "ready";
}

export async function buildCareOSAgenticNetwork(params: {
  user: CurrentUser;
  request: CareOSNetworkRequest;
}): Promise<CareOSNetworkResponse> {
  const config = getMapAbleIntelligenceConfig();
  const requestId = randomUUID();
  const modules = [...new Set<MapAbleModule>(["core", ...params.request.modules])];
  const consentScopes = buildSessionConsent({
    modules,
    includeAccessibilityProfile: params.request.includeAccessibilityProfile,
  });

  const results = await Promise.all(
    modules.map((module) =>
      readModule({ module, user: params.user, consentScopes })
    )
  );

  const mission = buildCareOSMissionGraph({
    goal: params.request.goal,
    results,
  });

  const continuityEnabled =
    config.continuityRadarEnabled && params.request.includeContinuityAnalysis;
  const continuityAlerts = continuityEnabled
    ? analyseCareOSContinuity(mission)
    : [];
  const agents = selectCareOSAgentNetwork({
    modules,
    enabledModules: config.modules,
    includeContinuityAnalysis: continuityEnabled,
  });
  const recommendations = recommendationsFromAlerts(continuityAlerts);

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
        activeAgents: agents
          .filter((agent) => agent.status === "active")
          .map((agent) => agent.id),
        alertCodes: continuityAlerts.map((alert) => alert.code),
        accessibilityProfileIncluded:
          params.request.includeAccessibilityProfile,
        writeActionsEnabled: config.writeActionsEnabled,
      },
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    requestId,
    participantId: params.user.id,
    goal: params.request.goal,
    status: responseStatus(results, continuityAlerts),
    agents,
    mission,
    continuityAlerts,
    recommendations,
    notices: [
      "This CareOS network is advisory and read-only. It did not book, assign, disclose, claim or pay anything.",
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
}
