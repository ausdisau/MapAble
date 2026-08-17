import { hasParticipantAuthority } from "@/lib/authority/participant-authority-service";
import {
  assertFederatedIdentityBoundary,
  ensureFederationEnabled,
  nationalPlatformConfig,
} from "@/lib/config/national-platform";
import type {
  FederatedIdentityClaims,
  FederationSessionContext,
} from "@/lib/platform/federation/contracts";
import { prisma } from "@/lib/prisma";

export async function resolveActiveFederationTrust(issuerUrl: string) {
  ensureFederationEnabled();
  return prisma.federationTrust.findFirst({
    where: { issuerUrl, status: "active" },
  });
}

export async function establishFederationSession(
  claims: FederatedIdentityClaims,
  trustId: string,
): Promise<FederationSessionContext> {
  assertFederatedIdentityBoundary();

  const trust = await prisma.federationTrust.findUnique({ where: { id: trustId } });
  if (!trust || trust.status !== "active") {
    throw new Error("FEDERATION_TRUST_INACTIVE");
  }

  if (!trust.participantAuthorityBlocked) {
    throw new Error("FEDERATION_TRUST_MUST_BLOCK_PARTICIPANT_AUTHORITY");
  }

  return {
    trustId,
    federatedUserId: claims.sub,
    participantAuthorityGranted: false,
    scopes: trust.scopesAllowed,
  };
}

/**
 * Federated identity never auto-grants participant authority.
 * Explicit CareOS consent/authority flow is required separately.
 */
export async function checkFederatedParticipantAuthority(input: {
  participantId: string;
  actorUserId: string;
  domain: string;
  action: string;
  isFederatedSession: boolean;
}): Promise<boolean> {
  assertFederatedIdentityBoundary();

  if (input.isFederatedSession) {
    if (nationalPlatformConfig.federatedIdentityGrantsParticipantAuthority) {
      return false;
    }
    return hasParticipantAuthority({
      participantId: input.participantId,
      actorUserId: input.actorUserId,
      domain: input.domain,
      action: input.action,
    });
  }

  return hasParticipantAuthority({
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    domain: input.domain,
    action: input.action,
  });
}

export async function listFederationTrusts(limit = 50) {
  if (!nationalPlatformConfig.federationEnabled) {
    return { disabled: true as const, trusts: [] };
  }
  const trusts = await prisma.federationTrust.findMany({
    orderBy: { partnerName: "asc" },
    take: limit,
    select: {
      id: true,
      partnerName: true,
      protocol: true,
      issuerUrl: true,
      status: true,
      participantAuthorityBlocked: true,
      scopesAllowed: true,
      createdAt: true,
    },
  });
  return { disabled: false as const, trusts };
}

export async function listRegionalOrganisations(regionCode?: string) {
  if (!nationalPlatformConfig.federationEnabled) {
    return { disabled: true as const, organisations: [] };
  }
  const organisations = await prisma.regionalOrganisation.findMany({
    where: regionCode ? { regionCode } : undefined,
    orderBy: { displayName: "asc" },
    take: 100,
    select: {
      id: true,
      regionCode: true,
      displayName: true,
      status: true,
      directoryRef: true,
      organisationId: true,
    },
  });
  return { disabled: false as const, organisations };
}
