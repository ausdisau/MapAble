import type { EngagementSubmission } from "@prisma/client";

import { isAdminRole } from "@/lib/auth/roles";
import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";
import type { ConsentScope } from "@/types/mapable";

export type EngagementAccessMode = "participant" | "delegate_read" | "delegate_submit" | "admin" | "provider";

export async function resolveEngagementParticipantId(params: {
  userId: string;
  role: string;
  requestedParticipantId?: string;
}): Promise<{
  participantId: string;
  mode: EngagementAccessMode;
  delegateScope?: ConsentScope;
} | null> {
  const { userId, role, requestedParticipantId } = params;

  if (isAdminRole(role as never)) {
    if (!requestedParticipantId) return null;
    return { participantId: requestedParticipantId, mode: "admin" };
  }

  if (role === "participant") {
    return { participantId: userId, mode: "participant" };
  }

  if (role === "family_member" && requestedParticipantId) {
    const [canRead, canSubmit] = await Promise.all([
      checkConsent({
        subjectUserId: requestedParticipantId,
        scope: "engagement.read_delegate",
        grantedToUserId: userId,
      }),
      checkConsent({
        subjectUserId: requestedParticipantId,
        scope: "engagement.submit_delegate",
        grantedToUserId: userId,
      }),
    ]);
    if (canSubmit) {
      return {
        participantId: requestedParticipantId,
        mode: "delegate_submit",
        delegateScope: "engagement.submit_delegate",
      };
    }
    if (canRead) {
      return {
        participantId: requestedParticipantId,
        mode: "delegate_read",
        delegateScope: "engagement.read_delegate",
      };
    }
    return null;
  }

  return null;
}

export function submissionListWhereForParticipant(participantId: string) {
  return { participantId };
}

export async function canUserAccessSubmission(
  submission: Pick<EngagementSubmission, "participantId" | "submittedById">,
  userId: string,
  role: string,
  delegateParticipantId?: string
): Promise<boolean> {
  if (isAdminRole(role as never)) return true;

  if (submission.participantId === userId || submission.submittedById === userId) {
    return true;
  }

  if (role === "family_member" && delegateParticipantId === submission.participantId) {
    const canRead = await checkConsent({
      subjectUserId: submission.participantId,
      scope: "engagement.read_delegate",
      grantedToUserId: userId,
    });
    return canRead;
  }

  return false;
}

export async function canUserSubmitForParticipant(
  participantId: string,
  userId: string,
  role: string
): Promise<{ allowed: boolean; delegateScope?: ConsentScope }> {
  if (role === "participant" && participantId === userId) {
    return { allowed: true };
  }

  if (role === "family_member") {
    const canSubmit = await checkConsent({
      subjectUserId: participantId,
      scope: "engagement.submit_delegate",
      grantedToUserId: userId,
    });
    if (canSubmit) {
      return { allowed: true, delegateScope: "engagement.submit_delegate" };
    }
  }

  return { allowed: false };
}

export async function getProviderOrganisationIds(userId: string): Promise<string[]> {
  const memberships = await prisma.organisationMember.findMany({
    where: { userId },
    select: { organisationId: true },
  });
  return memberships.map((m) => m.organisationId);
}

export async function canProviderAccessOrg(
  userId: string,
  organisationId: string
): Promise<boolean> {
  const member = await prisma.organisationMember.findFirst({
    where: { userId, organisationId },
  });
  return Boolean(member);
}
