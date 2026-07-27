import { checkConsent } from "@/lib/consent/consent-service";

/**
 * This release recognises delegates only where an existing explicit MapAble
 * consent record grants access. It never infers booking authority from a
 * family role and never grants write authority.
 */
export async function resolveDelegateAuthority(params: {
  participantId: string;
  delegateId: string;
}) {
  const canRead = await checkConsent({
    subjectUserId: params.participantId,
    grantedToUserId: params.delegateId,
    scope: "profile.read",
  });

  return {
    actingForSelf: false,
    delegateId: params.delegateId,
    allowedActions: canRead ? ["read_information"] : [],
  };
}
