/**
 * Y3 national trust flags. All default false in .env.example.
 */
export const y3NationalTrustConfig = {
  trustPassportPilotEnabled:
    process.env.TRUST_PASSPORT_PILOT_ENABLED === "true",
  continuityIntelligenceEnabled:
    process.env.CONTINUITY_INTELLIGENCE_ENABLED === "true",
  budgetGuidanceEnabled: process.env.BUDGET_GUIDANCE_ENABLED === "true",
  publicApiV2PartnerEnabled:
    process.env.PUBLIC_API_V2_PARTNER_ENABLED === "true",
  nationalInsightsV2Enabled:
    process.env.NATIONAL_INSIGHTS_V2_ENABLED === "true",
  assessorNetworkPilotEnabled:
    process.env.ASSESSOR_NETWORK_PILOT_ENABLED === "true",
  workerAssistCopilotEnabled:
    process.env.WORKER_ASSIST_COPILOT_ENABLED === "true",
  participationPlannerEnabled:
    process.env.PARTICIPATION_PLANNER_ENABLED === "true",
};

export const NON_ADVISORY_DISCLAIMER =
  "This information is for visibility only. It is not financial, legal, or plan management advice.";

export const WORKER_ASSIST_DISCLAIMER =
  "Shift assist helps with your current shift only. It is not for monitoring participants.";
