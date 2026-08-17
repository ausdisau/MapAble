import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { checkConsent } from "@/lib/consent/consent-service";

export class ParticipantAccessError extends Error {
  constructor(
    message: string,
    public code: "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN"
  ) {
    super(message);
    this.name = "ParticipantAccessError";
  }
}

export async function assertCanAccessParticipantData(
  user: CurrentUser,
  participantId: string
): Promise<void> {
  if (isAdminRole(user.primaryRole)) return;
  if (user.id === participantId) return;

  if (user.primaryRole === "support_coordinator") {
    const allowed = await checkConsent({
      subjectUserId: participantId,
      scope: "support_coordination.access",
      grantedToUserId: user.id,
    });
    if (allowed) return;
  }

  if (user.primaryRole === "family_member") {
    const allowed = await checkConsent({
      subjectUserId: participantId,
      scope: "profile.read",
      grantedToUserId: user.id,
    });
    if (allowed) return;
  }

  throw new ParticipantAccessError("Participant access denied");
}
