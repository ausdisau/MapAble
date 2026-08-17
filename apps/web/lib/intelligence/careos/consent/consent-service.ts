import { checkConsent } from "@/lib/consent/consent-service";

import type { CareOSContext } from "../context/careos-context";

import {
  CAREOS_CONSENT_EXPLANATIONS,
  CAREOS_SCOPE_TO_MAPABLE_SCOPE,
  type CareOSConsentScope,
} from "./scopes";

export class CareOSConsentError extends Error {
  constructor(public readonly missingScopes: CareOSConsentScope[]) {
    super("CONSENT_REQUIRED");
    this.name = "CareOSConsentError";
  }
}

export function hasConsentScope(
  context: CareOSContext,
  scope: CareOSConsentScope
): boolean {
  return context.consent.grantedScopes.includes(scope);
}

export function getMissingConsentScopes(
  context: CareOSContext,
  scopes: CareOSConsentScope[]
): CareOSConsentScope[] {
  return scopes.filter((scope) => !hasConsentScope(context, scope));
}

export function requireConsentScope(
  context: CareOSContext,
  scope: CareOSConsentScope
): void {
  if (!hasConsentScope(context, scope)) throw new CareOSConsentError([scope]);
}

export function buildConsentExplanation(scope: CareOSConsentScope) {
  const details = CAREOS_CONSENT_EXPLANATIONS[scope];
  return {
    scope,
    ...details,
    continueWithoutGranting:
      "You can continue without granting this permission. CareOS will leave this information out and explain any limits.",
  };
}

export async function getAuthoritativeCareOSConsentScopes(params: {
  participantId: string;
  actorUserId: string;
}): Promise<CareOSConsentScope[]> {
  const entries = await Promise.all(
    Object.entries(CAREOS_SCOPE_TO_MAPABLE_SCOPE).map(async ([scope, mapped]) => ({
      scope: scope as CareOSConsentScope,
      granted: mapped
        ? await checkConsent({
            subjectUserId: params.participantId,
            scope: mapped,
            grantedToUserId:
              params.actorUserId === params.participantId
                ? undefined
                : params.actorUserId,
          })
        : false,
    }))
  );

  // A participant always has access to their own profile; this is not a
  // disclosure grant to anyone else.
  if (params.participantId === params.actorUserId) {
    (
      [
        "profile.basic",
        "profile.communication",
        "care.preferences",
        "care.requests",
        "care.schedule",
        "transport.location",
        "transport.bookings",
        "access.place_evidence",
      ] satisfies CareOSConsentScope[]
    ).forEach((scope) => entries.push({ scope, granted: true }));
  }

  return entries.filter((entry) => entry.granted).map((entry) => entry.scope);
}
