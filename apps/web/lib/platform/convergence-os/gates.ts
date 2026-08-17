import { jsonError } from "@/lib/api/response";
import {
  convergenceOsConfig,
  isConvergenceOsEnabled,
} from "@/lib/config/convergence-os";

export function convergenceDisabledResponse(): Response {
  return jsonError(
    "ConvergenceOS is disabled. Set MAPABLE_CONVERGENCE_OS_ENABLED=true to use audit APIs.",
    404
  );
}

export function requireConvergenceEnabled(): Response | null {
  if (!isConvergenceOsEnabled()) {
    return convergenceDisabledResponse();
  }
  return null;
}

export type ConvergenceFeatureGate =
  | "domainRegistry"
  | "branchGraph"
  | "schemaScan"
  | "mergeTrain"
  | "capabilityCatalogue"
  | "twin"
  | "constitution"
  | "semanticResolver"
  | "lineage"
  | "blastRadius"
  | "rehearsal"
  | "agentPreflight"
  | "drift"
  | "envParity"
  | "supplyChain"
  | "ownership"
  | "goldenJourney"
  | "federation";

export function requireConvergenceFeature(
  feature: ConvergenceFeatureGate
): Response | null {
  const disabled = requireConvergenceEnabled();
  if (disabled) return disabled;

  const map: Record<ConvergenceFeatureGate, boolean> = {
    domainRegistry: convergenceOsConfig.domainRegistryEnabled,
    branchGraph: convergenceOsConfig.branchGraphEnabled,
    schemaScan: convergenceOsConfig.schemaScanEnabled,
    mergeTrain: convergenceOsConfig.mergeTrainEnabled,
    capabilityCatalogue: convergenceOsConfig.capabilityCatalogueEnabled,
    twin: convergenceOsConfig.twinEnabled,
    constitution: convergenceOsConfig.constitutionEnabled,
    semanticResolver: convergenceOsConfig.semanticResolverEnabled,
    lineage: convergenceOsConfig.lineageEnabled,
    blastRadius: convergenceOsConfig.blastRadiusEnabled,
    rehearsal: convergenceOsConfig.rehearsalEnabled,
    agentPreflight: convergenceOsConfig.agentPreflightEnabled,
    drift: convergenceOsConfig.driftEnabled,
    envParity: convergenceOsConfig.envParityEnabled,
    supplyChain: convergenceOsConfig.supplyChainEnabled,
    ownership: convergenceOsConfig.ownershipEnabled,
    goldenJourney: convergenceOsConfig.goldenJourneyEnabled,
    federation: convergenceOsConfig.federationEnabled,
  };

  if (!map[feature]) {
    return jsonError(
      `ConvergenceOS feature "${feature}" is disabled for this environment`,
      404
    );
  }
  return null;
}
