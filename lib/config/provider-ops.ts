export const providerOpsConfig = {
  enabled: process.env.MAPABLE_PROVIDER_OPS_ENABLED === "true",
};

export function isProviderOpsEnabled(): boolean {
  return providerOpsConfig.enabled;
}
