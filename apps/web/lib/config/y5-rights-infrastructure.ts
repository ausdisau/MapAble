import { phase10Config } from "@/lib/config/phase10";
import { phase12Config } from "@/lib/config/phase12";

/**
 * Y5 rights-governed infrastructure flags. All default false in .env.example.
 * Helpers layer on Phase 10/12 scaffolds when Y5 flags are off.
 */
export const y5RightsInfrastructureConfig = {
  apiCertificationV2Enabled:
    process.env.API_CERTIFICATION_V2_ENABLED === "true",
  certifiedApiEcosystemV2Enabled:
    process.env.CERTIFIED_API_ECOSYSTEM_V2_ENABLED === "true",
  federatedResearchV2Enabled:
    process.env.FEDERATED_RESEARCH_V2_ENABLED === "true",
  researchFederationAtScaleV2Enabled:
    process.env.RESEARCH_FEDERATION_AT_SCALE_V2_ENABLED === "true",
  communityGovernanceMembershipV2Enabled:
    process.env.COMMUNITY_GOVERNANCE_MEMBERSHIP_V2_ENABLED === "true",
  longTermOutcomesV2Enabled:
    process.env.LONG_TERM_OUTCOMES_V2_ENABLED === "true",
  federatedAccountabilityV2Enabled:
    process.env.FEDERATED_ACCOUNTABILITY_V2_ENABLED === "true",
  institutionalPermanenceV2Enabled:
    process.env.INSTITUTIONAL_PERMANENCE_V2_ENABLED === "true",
};

export const API_CERTIFICATION_DISCLAIMER =
  "API certification listings provide transparency labels only — not regulatory certification or compliance approval.";

export const FEDERATED_RESEARCH_DISCLAIMER =
  "Federated research agreements use synthetic data only — no real participant PII is shared across institutions.";

export const OUTCOMES_NON_ADVISORY_DISCLAIMER =
  "Long-term outcome snapshots are aggregate measurements for transparency — not clinical, financial, or policy advice.";

export const ACCOUNTABILITY_TRANSPARENCY_DISCLAIMER =
  "Accountability publications are transparency reports — not legal findings or regulatory determinations.";

export const PARTNER_CONCENTRATION_WARNING_THRESHOLD = 0.4;

export function isApiCertificationV2Enabled() {
  return (
    y5RightsInfrastructureConfig.apiCertificationV2Enabled ||
    phase10Config.apiCertificationProgramEnabled
  );
}

export function isCertifiedApiEcosystemV2Enabled() {
  return (
    y5RightsInfrastructureConfig.certifiedApiEcosystemV2Enabled ||
    phase12Config.certifiedApiEcosystemAtScaleEnabled
  );
}

export function isFederatedResearchV2Enabled() {
  return (
    y5RightsInfrastructureConfig.federatedResearchV2Enabled ||
    phase10Config.federatedResearchEnabled
  );
}

export function isResearchFederationAtScaleV2Enabled() {
  return (
    y5RightsInfrastructureConfig.researchFederationAtScaleV2Enabled ||
    phase12Config.researchFederationAtScaleEnabled
  );
}

export function isCommunityGovernanceMembershipV2Enabled() {
  return (
    y5RightsInfrastructureConfig.communityGovernanceMembershipV2Enabled ||
    phase12Config.communityGovernanceMembershipEnabled
  );
}

export function isLongTermOutcomesV2Enabled() {
  return y5RightsInfrastructureConfig.longTermOutcomesV2Enabled;
}

export function isFederatedAccountabilityV2Enabled() {
  return (
    y5RightsInfrastructureConfig.federatedAccountabilityV2Enabled ||
    phase12Config.federatedAccountabilityEnabled
  );
}

export function isInstitutionalPermanenceV2Enabled() {
  return y5RightsInfrastructureConfig.institutionalPermanenceV2Enabled;
}

export function assertCertificationTransparencyCopy(text: string) {
  const blocked = /\b(certified compliant|regulatory certification|ndis approved|compliance approved)\b/i;
  if (blocked.test(text)) {
    throw new Error("CERTIFICATION_CLAIM_BLOCKED");
  }
}
