import type { CurrentUser } from "@/lib/auth/current-user";

import { getMapAbleIntelligenceConfig } from "../config";
import type { IntelligenceSessionConsentScope } from "../consent/session-consent";
import {
  executeIntelligenceReadTool,
  IntelligenceToolAccessError,
  type IntelligenceToolName,
} from "../tools/registry";
import type { MapAbleModule } from "../types";

import type { CareOSMissionNode, CareOSModuleReadResult } from "./types";

type ModuleReadSpec = { tool?: IntelligenceToolName; input?: unknown };

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
  consentScopes: ReadonlySet<IntelligenceSessionConsentScope>;
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
    const value = await executeIntelligenceReadTool(
      spec.tool,
      spec.input ?? {},
      { user: params.user, consentScopes: params.consentScopes },
    );
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

export async function readCareOSModules(params: {
  modules: MapAbleModule[];
  user: CurrentUser;
  consentScopes: ReadonlySet<IntelligenceSessionConsentScope>;
}): Promise<CareOSModuleReadResult[]> {
  return Promise.all(
    params.modules.map((module) =>
      readModule({
        module,
        user: params.user,
        consentScopes: params.consentScopes,
      }),
    ),
  );
}

export async function readCareOSAccessibilityProfile(params: {
  requested: boolean;
  user: CurrentUser;
  consentScopes: ReadonlySet<IntelligenceSessionConsentScope>;
}): Promise<CareOSMissionNode | null> {
  if (!params.requested) return null;
  const config = getMapAbleIntelligenceConfig();
  if (!config.modules.transport) {
    return profileNode("disabled", "Transport intelligence is disabled, so the profile was not read.");
  }

  try {
    const value = (await executeIntelligenceReadTool(
      "read_mobility_preferences",
      {},
      { user: params.user, consentScopes: params.consentScopes },
    )) as { accessNotes?: string; fromProfile?: boolean };
    return {
      ...profileNode(
        value.fromProfile ? "available" : "missing",
        value.fromProfile
          ? `Participant-controlled mobility requirements were read for this request${value.accessNotes ? ", including access notes" : ""}.`
          : "Profile access was authorised, but no participant-controlled mobility preferences were available.",
      ),
      evidence: value.fromProfile ? ["participant_controlled_profile"] : [],
    };
  } catch (error) {
    if (error instanceof IntelligenceToolAccessError) {
      return profileNode(
        error.code === "PERMISSION_DENIED" || error.code === "CONSENT_REQUIRED"
          ? "not_authorised"
          : "needs_review",
        "The accessibility profile could not be read. Continue without it or review request permissions.",
      );
    }
    console.error("[careos-network-profile]", error);
    return profileNode("needs_review", "The accessibility profile was unavailable for this request.");
  }
}

function profileNode(
  status: CareOSMissionNode["status"],
  details: string,
): CareOSMissionNode {
  return {
    id: "mission-profile",
    type: "accessibility",
    label: "Participant accessibility profile",
    status,
    sourceModule: "transport",
    recordId: null,
    startsAt: null,
    details,
    evidence: [],
  };
}
