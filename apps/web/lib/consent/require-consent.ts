import type { ConsentScope as PrismaConsentScope } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { checkConsent } from "@/lib/consent/consent-service";
import { consentScopeToPrisma } from "@/lib/consent/scope-map";
import type { ConsentScope } from "@/types/mapable";

export async function requireConsent(params: {
  subjectUserId: string;
  scope: ConsentScope;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
  actorUserId: string;
}): Promise<void> {
  const allowed = await checkConsent({
    subjectUserId: params.subjectUserId,
    scope: params.scope,
    grantedToUserId: params.grantedToUserId,
    grantedToOrganisationId: params.grantedToOrganisationId,
  });

  if (!allowed) {
    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: "consent.share_blocked",
      entityType: "ConsentRecord",
      entityId: "blocked",
      participantId: params.subjectUserId,
      metadata: {
        scope: params.scope,
        grantedToOrganisationId: params.grantedToOrganisationId,
      },
    });
    throw new Error("CONSENT_REQUIRED");
  }
}

export function prismaScopeForApi(scope: ConsentScope): PrismaConsentScope {
  return consentScopeToPrisma(scope);
}
