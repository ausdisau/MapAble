export const engagementConfig = {
  enabled: process.env.ENGAGEMENT_PLATFORM_ENABLED === "true",
  providerInsightsEnabled:
    process.env.ENGAGEMENT_PROVIDER_INSIGHTS_ENABLED === "true",
  npsMinCohortSize: Number(process.env.ENGAGEMENT_NPS_MIN_COHORT ?? "5"),
  acknowledgementBusinessDays: Number(
    process.env.ENGAGEMENT_ACK_BUSINESS_DAYS ?? "2"
  ),
};

export function isEngagementPlatformEnabled(): boolean {
  return engagementConfig.enabled;
}
