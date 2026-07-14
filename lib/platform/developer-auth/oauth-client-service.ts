import { randomBytes } from "crypto";

import type { ApiScope } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { ensureDeveloperPlatformEnabled } from "@/lib/config/developer-platform";
import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/stripe-billing/checkout-service";

export async function registerOAuthClient(input: {
  apiClientId: string;
  redirectUris: string[];
  scopes: ApiScope[];
  actorUserId: string;
}) {
  ensureDeveloperPlatformEnabled();
  const clientId = `oauth_${randomBytes(12).toString("hex")}`;
  const rawSecret = `ocs_${randomBytes(24).toString("hex")}`;

  const oauthClient = await prisma.oAuthClient.create({
    data: {
      apiClientId: input.apiClientId,
      clientId,
      clientSecretHash: hashApiKey(rawSecret),
      clientSecretPrefix: rawSecret.slice(0, 14),
      redirectUris: input.redirectUris,
      scopes: input.scopes,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "developer_platform.oauth_client_registered",
    entityType: "OAuthClient",
    entityId: oauthClient.id,
  });

  return {
    oauthClientId: oauthClient.id,
    clientId,
    clientSecret: rawSecret,
    message: "Store the client secret securely — it cannot be shown again.",
  };
}

export async function createOAuthGrant(input: {
  oauthClientId: string;
  participantId: string;
  userId: string;
  scopes: ApiScope[];
  expiresInHours?: number;
}) {
  const expiresAt = new Date(
    Date.now() + (input.expiresInHours ?? 24) * 60 * 60 * 1000,
  );
  const accessRaw = randomBytes(32).toString("hex");
  const refreshRaw = randomBytes(32).toString("hex");

  const grant = await prisma.oAuthGrant.create({
    data: {
      oauthClientId: input.oauthClientId,
      participantId: input.participantId,
      userId: input.userId,
      scopes: input.scopes,
      accessTokenHash: hashApiKey(accessRaw),
      refreshTokenHash: hashApiKey(refreshRaw),
      expiresAt,
    },
  });

  return {
    grantId: grant.id,
    accessToken: accessRaw,
    refreshToken: refreshRaw,
    expiresAt,
  };
}

export async function revokeOAuthGrant(grantId: string, actorUserId: string) {
  await prisma.oAuthGrant.update({
    where: { id: grantId },
    data: { revokedAt: new Date() },
  });
  await createAuditEvent({
    actorUserId,
    action: "developer_platform.oauth_grant_revoked",
    entityType: "OAuthGrant",
    entityId: grantId,
  });
}
