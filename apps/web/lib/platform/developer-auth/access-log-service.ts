import { hasParticipantAuthority } from "@/lib/authority/participant-authority-service";
import { developerPlatformConfig } from "@/lib/config/developer-platform";
import { prisma } from "@/lib/prisma";

export async function enforceParticipantAuthority(input: {
  participantId: string;
  actorUserId: string;
  domain: string;
  action: string;
  isServiceAccount: boolean;
}) {
  if (input.isServiceAccount) {
    if (!developerPlatformConfig.serviceAccountParticipantAuthorityEnabled) {
      return false;
    }
  }

  return hasParticipantAuthority({
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    domain: input.domain,
    action: input.action,
  });
}

export async function logApiAccess(input: {
  apiClientId: string;
  apiKeyId?: string;
  serviceAccountId?: string;
  path: string;
  method: string;
  statusCode: number;
  durationMs?: number;
  ipAddress?: string;
  userAgent?: string;
  participantId?: string;
}) {
  await prisma.apiAccessLog.create({ data: input });
}
