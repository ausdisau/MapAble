import type { MapAbleModule } from "./types";

function envBoolean(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value == null || value === "") return fallback;
  return value === "true" || value === "1" || value === "yes";
}

const MODULE_FLAG_NAMES: Record<MapAbleModule, string> = {
  core: "MAPABLE_AI_CORE_ENABLED",
  care: "MAPABLE_AI_CARE_ENABLED",
  transport: "MAPABLE_AI_TRANSPORT_ENABLED",
  jobs: "MAPABLE_AI_JOBS_ENABLED",
  access: "MAPABLE_AI_ACCESS_ENABLED",
  moves: "MAPABLE_AI_MOVES_ENABLED",
  foods: "MAPABLE_AI_FOODS_ENABLED",
  payments: "MAPABLE_AI_PAYMENTS_ENABLED",
};

const MODULE_DEFAULTS: Record<MapAbleModule, boolean> = {
  core: true,
  care: true,
  transport: true,
  jobs: true,
  access: true,
  moves: false,
  foods: false,
  payments: false,
};

export type MapAbleIntelligenceRuntimeConfig = {
  enabled: boolean;
  modelReasoningEnabled: boolean;
  writeActionsEnabled: boolean;
  participantMemoryEnabled: boolean;
  auditEnabled: boolean;
  careOSNetworkEnabled: boolean;
  continuityRadarEnabled: boolean;
  careOSPersistenceEnabled: boolean;
  careOSEventAutomationEnabled: boolean;
  roboticsMcpEnabled: boolean;
  modules: Record<MapAbleModule, boolean>;
};

export function getMapAbleIntelligenceConfig(): MapAbleIntelligenceRuntimeConfig {
  const enabled = envBoolean("MAPABLE_AI_ENABLED", true);
  const modules = Object.fromEntries(
    (Object.keys(MODULE_FLAG_NAMES) as MapAbleModule[]).map((module) => [
      module,
      enabled && envBoolean(MODULE_FLAG_NAMES[module], MODULE_DEFAULTS[module]),
    ]),
  ) as Record<MapAbleModule, boolean>;

  return {
    enabled,
    modelReasoningEnabled:
      enabled &&
      Boolean(process.env.OPENAI_API_KEY) &&
      envBoolean("MAPABLE_AI_MODEL_REASONING_ENABLED", true),
    writeActionsEnabled:
      enabled && envBoolean("MAPABLE_AI_WRITE_ACTIONS", false),
    participantMemoryEnabled:
      enabled && envBoolean("MAPABLE_AI_MEMORY_ENABLED", false),
    auditEnabled: envBoolean("MAPABLE_AI_AUDIT_ENABLED", true),
    careOSNetworkEnabled:
      enabled && envBoolean("MAPABLE_CAREOS_NETWORK_ENABLED", true),
    continuityRadarEnabled:
      enabled && envBoolean("MAPABLE_CAREOS_CONTINUITY_ENABLED", true),
    careOSPersistenceEnabled:
      enabled && envBoolean("MAPABLE_CAREOS_PERSISTENCE_ENABLED", false),
    careOSEventAutomationEnabled:
      enabled && envBoolean("MAPABLE_CAREOS_EVENT_AUTOMATION_ENABLED", false),
    roboticsMcpEnabled:
      enabled && envBoolean("MAPABLE_CAREOS_ROBOTICS_MCP_ENABLED", false),
    modules,
  };
}

export function isMapAbleIntelligenceModuleEnabled(
  module: MapAbleModule,
): boolean {
  return getMapAbleIntelligenceConfig().modules[module];
}
