import { randomUUID } from "crypto";

import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

import { resolveDelegateAuthority } from "../authority/delegate-authority";
import {
  careOSActorTypeForUser,
  participantAuthority,
} from "../authority/participant-authority";
import { getAuthoritativeCareOSConsentScopes } from "../consent/consent-service";
import { careOSFeatureFlags } from "../config/feature-flags";
import type { CareOSContext } from "./careos-context";

const CAREOS_READ_PERMISSIONS: Permission[] = [
  "profile:read:self",
  "accessibility:read:self",
  "care:read:self",
  "transport:read:self",
  "calendar:read:self",
];

export async function buildCareOSContext(params: {
  user: CurrentUser;
  participantId?: string;
  requestId?: string;
  traceId?: string;
  channel?: CareOSContext["runtime"]["channel"];
  requestScopedConsent?: string[];
}): Promise<CareOSContext> {
  const participantId = params.participantId ?? params.user.id;
  const profile = await prisma.participantProfile.findUnique({
    where: { userId: participantId },
  });
  if (!profile) throw new Error("PARTICIPANT_NOT_FOUND");

  const authority =
    params.user.id === participantId
      ? participantAuthority(params.user, participantId)
      : await resolveDelegateAuthority({
          participantId,
          delegateId: params.user.id,
        });

  if (authority.allowedActions.length === 0) throw new Error("AUTHORITY_DENIED");

  const grantedScopes = await getAuthoritativeCareOSConsentScopes({
    participantId,
    actorUserId: params.user.id,
  });
  const requestScopedConsent = params.requestScopedConsent ?? [];
  const permissions = CAREOS_READ_PERMISSIONS.filter((permission) =>
    hasPermission(params.user.primaryRole, permission)
  );

  return {
    requestId: params.requestId ?? randomUUID(),
    sessionId: randomUUID(),
    traceId: params.traceId ?? randomUUID(),
    actor: {
      userId: params.user.id,
      roles: params.user.roles,
      permissions,
      actorType: careOSActorTypeForUser(params.user),
    },
    participant: {
      participantId,
      preferredName: profile.preferredName ?? profile.displayName,
      locale: params.user.locale,
      timezone: profile.timezone ?? params.user.timezone,
    },
    authority: {
      ...authority,
      expiresAt: undefined,
    },
    communication: {
      plainLanguage: true,
      easyRead: false,
      preferredChannels: [profile.primaryContactMethod],
      usesAAC: false,
      responseLength: "standard",
    },
    consent: {
      grantedScopes: [...new Set([...grantedScopes, ...requestScopedConsent])],
      deniedScopes: [],
      requestScoped: true,
    },
    runtime: {
      channel: params.channel ?? "web",
      aiEnabled: careOSFeatureFlags.enabled && careOSFeatureFlags.aiEnabled,
      writeActionsEnabled: false,
    },
  };
}
