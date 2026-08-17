import { phase10Config } from "@/lib/config/phase10";
import { phase9Config } from "@/lib/config/phase9";

/**
 * Y4 civic platform flags. All default false in .env.example.
 * Helpers layer on Phase 9/10 scaffolds when Y4 flags are off.
 */
export const y4CivicPlatformConfig = {
  dataVaultV2Enabled: process.env.DATA_VAULT_V2_ENABLED === "true",
  publicDecisionRegisterV2Enabled:
    process.env.PUBLIC_DECISION_REGISTER_V2_ENABLED === "true",
  researchSafeRoomPilotEnabled:
    process.env.RESEARCH_SAFE_ROOM_PILOT_ENABLED === "true",
  providerBenchmarkingV2Enabled:
    process.env.PROVIDER_BENCHMARKING_V2_ENABLED === "true",
  algorithmRegisterV2Enabled:
    process.env.ALGORITHM_REGISTER_V2_ENABLED === "true",
  oversightBoardV2Enabled: process.env.OVERSIGHT_BOARD_V2_ENABLED === "true",
  governanceCharterGateEnabled:
    process.env.GOVERNANCE_CHARTER_GATE_ENABLED === "true",
  privacyPreservingAnalyticsPilotEnabled:
    process.env.PRIVACY_PRESERVING_ANALYTICS_PILOT_ENABLED === "true",
};

export const HUMAN_REVIEW_DISCLAIMER =
  "All export and deletion requests require human review before completion.";

export const BENCHMARK_DISCLAIMER =
  "Benchmarks are aggregate and may be suppressed for small cohorts — not rankings.";

export const ALGORITHM_TRANSPARENCY_DISCLAIMER =
  "Algorithm register entries provide transparency only — not regulatory certification.";

export const PRIVACY_ANALYTICS_DISCLAIMER =
  "Placeholder differential privacy — not production-grade DP implementation.";

export function isDataVaultV2Enabled() {
  return (
    y4CivicPlatformConfig.dataVaultV2Enabled ||
    phase9Config.personalDataVaultEnabled
  );
}

export function isPublicDecisionRegisterV2Enabled() {
  return (
    y4CivicPlatformConfig.publicDecisionRegisterV2Enabled ||
    phase9Config.publicDecisionRegisterEnabled
  );
}

export function isResearchSafeRoomPilotEnabled() {
  return (
    y4CivicPlatformConfig.researchSafeRoomPilotEnabled ||
    phase9Config.researchSafeRoomEnabled
  );
}

export function isAlgorithmRegisterV2Enabled() {
  return (
    y4CivicPlatformConfig.algorithmRegisterV2Enabled ||
    phase10Config.publicAlgorithmRegisterEnabled
  );
}

export function isOversightBoardV2Enabled() {
  return (
    y4CivicPlatformConfig.oversightBoardV2Enabled ||
    phase10Config.oversightBoardPortalEnabled
  );
}

export function isPrivacyAnalyticsPilotEnabled() {
  return (
    y4CivicPlatformConfig.privacyPreservingAnalyticsPilotEnabled ||
    phase10Config.privacyPreservingAnalyticsEnabled
  );
}
