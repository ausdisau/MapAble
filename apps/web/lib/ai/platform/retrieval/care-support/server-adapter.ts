/**
 * Runtime bridge to MapAble Core identity, membership, ConsentRecord and AuditEvent.
 * No HTTP route or model/tool invocation references this module in the initial PR.
 * Production is unconditionally disabled even when environment flags are set.
 */
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isAuraHarnessEnabled } from "@/lib/aura-harness/config";
import { isProgrammeAuraStopped } from "@/lib/programmes/aura/execution-gate";
import { prisma } from "@/lib/prisma";

import {
  CARE_RAG_PURPOSE,
  ParticipantRAG,
  ProviderRAG,
  shouldEnableSyntheticRag,
  type CareRagPorts,
  type CareRagStore,
  type ExistingConsentView,
} from "./care-support-rag";

export function isSyntheticCareRagEnabled(): boolean {
  return shouldEnableSyntheticRag({
    nodeEnv: process.env.NODE_ENV,
    featureFlag: process.env.MAPABLE_CARE_SUPPORT_RAG_ENABLED,
    auraHarnessEnabled: isAuraHarnessEnabled(),
  });
}

/**
 * This adapter can only be constructed with a store explicitly supplied by a
 * trusted server call site. Do not pass uncontrolled client parameters to it.
 * A production store/participant endpoint is intentionally not provided.
 */
export function createCareSupportRagServerRuntime(store: CareRagStore): {
  participant_rag: ParticipantRAG;
  provider_rag: ProviderRAG;
} {
  const ports: CareRagPorts = {
    enabled: isSyntheticCareRagEnabled,
    stopped: isProgrammeAuraStopped,
    authenticatedActor: async () => {
      const user = await getCurrentUser();
      return user ? { id: user.id } : null;
    },
    organisationMembershipIds: getUserOrganisationIds,
    latestConsent: async ({ actorId, participantId, purpose }): Promise<ExistingConsentView | null> => {
      if (purpose !== CARE_RAG_PURPOSE || actorId !== participantId) return null;
      // Includes revoked/pending rows to fail closed if the latest record is not active.
      // Scope is an existing enum; this is NOT a new consent system or grant writer.
      const latest = await prisma.consentRecord.findFirst({
        where: {
          subjectUserId: participantId,
          grantedToUserId: actorId,
          grantedToOrganisationId: null,
          createdById: participantId,
          scope: "support_profile_read",
          purpose,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          subjectUserId: true,
          grantedToUserId: true,
          grantedToOrganisationId: true,
          createdById: true,
          scope: true,
          purpose: true,
          status: true,
          sourceAction: true,
          dataScope: true,
          expiryDate: true,
          revokedAt: true,
        },
      });
      if (!latest) return null;
      return {
        id: latest.id,
        subjectUserId: latest.subjectUserId,
        grantedToUserId: latest.grantedToUserId,
        grantedToOrganisationId: latest.grantedToOrganisationId,
        createdById: latest.createdById,
        scope: latest.scope,
        purpose: latest.purpose,
        status: latest.status,
        sourceAction: latest.sourceAction,
        dataScope: latest.dataScope,
        expiresAt: latest.expiryDate,
        revokedAt: latest.revokedAt,
      };
    },
    auditRead: async ({ actorId, participantId, tenantId, operation, evidenceCount }) => {
      await createAuditEvent({
        actorUserId: actorId,
        action: operation,
        entityType: "CarePerceptualRAG",
        entityId: "synthetic-shadow-read",
        participantId: participantId ?? undefined,
        organisationId: tenantId ?? undefined,
        metadata: { mode: "synthetic_only", evidenceCount },
      });
    },
    now: () => new Date(),
  };
  return {
    participant_rag: new ParticipantRAG(ports, store),
    provider_rag: new ProviderRAG(ports, store),
  };
}
