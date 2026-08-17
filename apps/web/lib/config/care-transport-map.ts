/**
 * Care + Transport GPT/OSM map and add-infrastructure flags.
 * Both default false (fail-closed / controlled pilot).
 */

export const careTransportMapConfig = {
  mapEnabled: process.env.CARE_TRANSPORT_MAP_ENABLED === "true",
  addInfrastructureEnabled:
    process.env.ADD_INFRASTRUCTURE_ENABLED === "true",
  pinLimit: (() => {
    const n = Number(process.env.CARE_TRANSPORT_MAP_PIN_LIMIT ?? "500");
    if (!Number.isFinite(n) || n < 1) return 500;
    return Math.min(Math.floor(n), 2000);
  })(),
};

export function isCareTransportMapEnabled(): boolean {
  return process.env.CARE_TRANSPORT_MAP_ENABLED === "true";
}

export function isAddInfrastructureEnabled(): boolean {
  return process.env.ADD_INFRASTRUCTURE_ENABLED === "true";
}

export function getCareTransportMapPinLimit(): number {
  return careTransportMapConfig.pinLimit;
}

/** AccessPlace categories shown on the Care+Transport infrastructure layer. */
export const CARE_TRANSPORT_INFRA_CATEGORIES = [
  "care_support_hub",
  "accessible_pickup_point",
  "transport_depot",
  "transport_station",
  "health_service",
  "community_centre",
] as const;

export type CareTransportInfraCategory =
  (typeof CARE_TRANSPORT_INFRA_CATEGORIES)[number];
