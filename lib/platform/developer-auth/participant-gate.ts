import { hasParticipantAuthority } from "@/lib/authority/participant-authority-service";
import { developerPlatformConfig } from "@/lib/config/developer-platform";

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
