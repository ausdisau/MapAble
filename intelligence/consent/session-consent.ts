import type { MapAbleModule } from "../types";

export const INTELLIGENCE_SESSION_CONSENT_SCOPES = [
  "core.summary",
  "care.summary",
  "transport.summary",
  "jobs.summary",
  "access.summary",
  "moves.summary",
  "foods.summary",
  "payments.summary",
  "profile.accessibility",
] as const;

export type IntelligenceSessionConsentScope =
  (typeof INTELLIGENCE_SESSION_CONSENT_SCOPES)[number];

const MODULE_SCOPE: Record<MapAbleModule, IntelligenceSessionConsentScope> = {
  core: "core.summary",
  care: "care.summary",
  transport: "transport.summary",
  jobs: "jobs.summary",
  access: "access.summary",
  moves: "moves.summary",
  foods: "foods.summary",
  payments: "payments.summary",
};

export function scopeForModule(module: MapAbleModule): IntelligenceSessionConsentScope {
  return MODULE_SCOPE[module];
}

export function buildSessionConsent(params: {
  modules: MapAbleModule[];
  includeAccessibilityProfile: boolean;
  explicitScopes?: IntelligenceSessionConsentScope[];
}): ReadonlySet<IntelligenceSessionConsentScope> {
  const scopes = new Set<IntelligenceSessionConsentScope>(
    params.modules.map(scopeForModule)
  );

  scopes.add("core.summary");
  if (params.includeAccessibilityProfile) {
    scopes.add("profile.accessibility");
  }
  for (const scope of params.explicitScopes ?? []) scopes.add(scope);

  return scopes;
}

export function hasSessionConsent(
  scopes: ReadonlySet<IntelligenceSessionConsentScope>,
  required: readonly IntelligenceSessionConsentScope[]
): boolean {
  return required.every((scope) => scopes.has(scope));
}
