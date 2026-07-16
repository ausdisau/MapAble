import {
  convergenceOsConfig,
  isConvergenceOsEnabled,
} from "@/lib/config/convergence-os";
import { jsonError } from "@/lib/api/response";

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

export function requireConvergenceFeature(
  feature:
    | "domainRegistry"
    | "branchGraph"
    | "schemaScan"
    | "mergeTrain"
    | "capabilityCatalogue"
): Response | null {
  const disabled = requireConvergenceEnabled();
  if (disabled) return disabled;

  const map = {
    domainRegistry: convergenceOsConfig.domainRegistryEnabled,
    branchGraph: convergenceOsConfig.branchGraphEnabled,
    schemaScan: convergenceOsConfig.schemaScanEnabled,
    mergeTrain: convergenceOsConfig.mergeTrainEnabled,
    capabilityCatalogue: convergenceOsConfig.capabilityCatalogueEnabled,
  } as const;

  if (!map[feature]) {
    return jsonError(
      `ConvergenceOS feature "${feature}" is disabled for this environment`,
      404
    );
  }
  return null;
}
