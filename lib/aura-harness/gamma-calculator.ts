import { randomUUID } from "crypto";

import { auraHarnessConfig } from "@/lib/aura-harness/config";
import type { ActionContext, AuraRiskProfile } from "@/lib/aura-harness/types";

/**
 * Deterministic AURA gamma engine.
 *
 * With scores s on [0, 100] and weights w:
 * - U_tot = Σ w
 * - γ_action = Σ (s × w)
 * - γ_norm = γ_action / U_tot  (weighted average on 0–100;
 *   equivalent to 100 × Σ((s/100)×w) / U_tot)
 * - s̄_w = γ_action / U_tot
 * - σ²_γ = (1/U_tot) Σ w (s − s̄_w)²
 * - C_conc = 200 × √(σ²_γ)
 */
export class GammaCalculator {
  public calculateProfile(contexts: ActionContext[]): AuraRiskProfile {
    let rawGamma = 0;
    let uTot = 0;

    for (const ctx of contexts) {
      for (const dim of ctx.dimensions) {
        rawGamma += dim.score * dim.weight;
        uTot += dim.weight;
      }
    }

    if (uTot === 0) {
      throw new Error("AURA constraints violated: Zero dimension weight.");
    }

    const normalizedGamma = rawGamma / uTot;
    const sBarW = normalizedGamma;

    let varianceSum = 0;
    for (const ctx of contexts) {
      for (const dim of ctx.dimensions) {
        const delta = dim.score - sBarW;
        varianceSum += dim.weight * delta * delta;
      }
    }
    const variance = varianceSum / uTot;
    const concentrationCoeff = 200 * Math.sqrt(variance);

    const highGamma = normalizedGamma > auraHarnessConfig.maxGamma;
    const highConcentration =
      concentrationCoeff > auraHarnessConfig.maxConcentration;

    return {
      actionId: randomUUID(),
      rawGamma,
      normalizedGamma,
      variance,
      concentrationCoeff,
      highGamma,
      highConcentration,
      requiresHITL: highGamma && highConcentration,
    };
  }
}

export const gammaCalculator = new GammaCalculator();
