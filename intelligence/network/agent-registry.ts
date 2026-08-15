import type { MapAbleModule } from "../types";

import type {
  CareOSAgentActivation,
  CareOSAgentId,
  CareOSAuthorityLevel,
} from "./types";

type CareOSAgentDefinition = {
  id: CareOSAgentId;
  name: string;
  purpose: string;
  modules: MapAbleModule[];
  maximumAuthorityLevel: CareOSAuthorityLevel;
  capabilities: string[];
  defaultStatus: CareOSAgentActivation["status"];
};

const DEFINITIONS: CareOSAgentDefinition[] = [
  {
    id: "manager",
    name: "CareOS Mission Manager",
    purpose: "Own the participant-facing mission and coordinate bounded specialists.",
    modules: ["core"],
    maximumAuthorityLevel: "L2_RECOMMEND",
    capabilities: [
      "interpret participant goals",
      "build mission dependencies",
      "combine specialist findings",
      "surface uncertainty and manual pathways",
    ],
    defaultStatus: "active",
  },
  {
    id: "participant_advocate",
    name: "Participant Advocate",
    purpose: "Keep participant preferences, exclusions and authority visible across the network.",
    modules: ["core"],
    maximumAuthorityLevel: "L2_RECOMMEND",
    capabilities: [
      "protect participant hard constraints",
      "identify missing consent",
      "preserve edit, reject and non-AI pathways",
    ],
    defaultStatus: "active",
  },
  {
    id: "care_coordination",
    name: "Care Coordination Agent",
    purpose: "Analyse care requests, support coverage and continuity without assigning workers.",
    modules: ["care"],
    maximumAuthorityLevel: "L2_RECOMMEND",
    capabilities: [
      "read care request status",
      "identify unconfirmed support coverage",
      "prepare support coordination recommendations",
    ],
    defaultStatus: "available",
  },
  {
    id: "transport_coordination",
    name: "Accessible Transport Agent",
    purpose: "Analyse accessible transport dependencies and journey readiness.",
    modules: ["transport"],
    maximumAuthorityLevel: "L2_RECOMMEND",
    capabilities: [
      "read transport status",
      "identify missing linked journeys",
      "route to the governed journey planner",
    ],
    defaultStatus: "available",
  },
  {
    id: "access_evidence",
    name: "Access Evidence Agent",
    purpose: "Surface verified accessibility evidence and evidence gaps.",
    modules: ["access"],
    maximumAuthorityLevel: "L0_INFORMATION",
    capabilities: [
      "read published access records",
      "label confidence and source limitations",
      "identify when human verification is required",
    ],
    defaultStatus: "available",
  },
  {
    id: "continuity",
    name: "Continuity Radar",
    purpose: "Detect dependencies that may cause a support mission to fail.",
    modules: ["core", "care", "transport", "access"],
    maximumAuthorityLevel: "L2_RECOMMEND",
    capabilities: [
      "detect missing care or transport dependencies",
      "identify linked transport gaps",
      "prepare recovery actions",
    ],
    defaultStatus: "available",
  },
  {
    id: "worker_support",
    name: "Worker Support Copilot",
    purpose: "Prepare participant-approved shift information and worker guidance.",
    modules: ["care"],
    maximumAuthorityLevel: "L1_DRAFT",
    capabilities: [
      "prepare shift briefs",
      "surface communication requirements",
      "draft handover prompts",
    ],
    defaultStatus: "available",
  },
  {
    id: "provider_capacity",
    name: "Provider Capacity Agent",
    purpose: "Represent provider capability and availability evidence without making assignments.",
    modules: ["care", "transport"],
    maximumAuthorityLevel: "L0_INFORMATION",
    capabilities: [
      "summarise provider capacity evidence",
      "identify thin-market gaps",
      "request human verification of availability",
    ],
    defaultStatus: "available",
  },
  {
    id: "rights",
    name: "Rights and Advocacy Agent",
    purpose: "Explain records, agreements and escalation options in participant-controlled language.",
    modules: ["core", "care"],
    maximumAuthorityLevel: "L1_DRAFT",
    capabilities: [
      "prepare evidence timelines",
      "draft participant questions",
      "route complaints to independent human processes",
    ],
    defaultStatus: "available",
  },
  {
    id: "safeguarding",
    name: "Safeguarding Gate",
    purpose: "Identify when a concern must leave the agent network and enter a human safeguarding process.",
    modules: ["core", "care"],
    maximumAuthorityLevel: "L0_INFORMATION",
    capabilities: [
      "identify human-review boundaries",
      "preserve mandatory reporting pathways",
      "prevent autonomous incident conclusions",
    ],
    defaultStatus: "human_only",
  },
  {
    id: "finance",
    name: "AbilityPay Explanation Agent",
    purpose: "Explain invoice and budget records without approving, denying or paying them.",
    modules: ["payments"],
    maximumAuthorityLevel: "L0_INFORMATION",
    capabilities: [
      "summarise invoice status",
      "identify records requiring human review",
      "prepare questions for providers or plan managers",
    ],
    defaultStatus: "available",
  },
  {
    id: "robotics",
    name: "CareOS Robotics Coordinator",
    purpose: "Prepare bounded robotics tasks through a future MCP trust gateway.",
    modules: ["core"],
    maximumAuthorityLevel: "L1_DRAFT",
    capabilities: [
      "read approved device capabilities",
      "prepare simulation-only task proposals",
      "route physical actions through an independent safety controller",
    ],
    defaultStatus: "research_only",
  },
];

export function selectCareOSAgentNetwork(params: {
  modules: MapAbleModule[];
  enabledModules: Record<MapAbleModule, boolean>;
  includeContinuityAnalysis: boolean;
}): CareOSAgentActivation[] {
  const selected = new Set<MapAbleModule>(["core", ...params.modules]);

  return DEFINITIONS.map((definition) => {
    const relevant = definition.modules.some((module) => selected.has(module));
    const moduleEnabled = definition.modules.some(
      (module) => selected.has(module) && params.enabledModules[module]
    );

    let status: CareOSAgentActivation["status"] = definition.defaultStatus;
    let reason = "Available within the selected CareOS mission.";

    if (definition.id === "continuity" && !params.includeContinuityAnalysis) {
      status = "disabled";
      reason = "Continuity analysis was not selected for this request.";
    } else if (!relevant) {
      status = "disabled";
      reason = "Its MapAble module was not selected for this request.";
    } else if (!moduleEnabled && definition.defaultStatus !== "research_only") {
      status = "disabled";
      reason = "The required MapAble intelligence module is disabled.";
    } else if (definition.defaultStatus === "research_only") {
      reason = "Robotics remains simulation-only and is not connected to physical actuation.";
    } else if (definition.defaultStatus === "human_only") {
      reason = "Safeguarding conclusions and actions remain with authorised humans.";
    } else if (definition.id === "manager" || definition.id === "participant_advocate") {
      status = "active";
      reason = "Always active to coordinate the mission and protect participant authority.";
    } else {
      status = "active";
    }

    return {
      id: definition.id,
      name: definition.name,
      purpose: definition.purpose,
      status,
      maximumAuthorityLevel: definition.maximumAuthorityLevel,
      capabilities: definition.capabilities,
      reason,
    };
  });
}
