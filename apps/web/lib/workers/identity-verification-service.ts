import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import {
  type IdentityVerificationStatusView,
  isStripeIdentityConfigured,
} from "@/lib/workers/identity-verification-shared";
export type {
  IdentityVerificationProvider,
  IdentityVerificationStatusView,
} from "@/lib/workers/identity-verification-shared";
export {
  IDENTITY_VERIFICATION_STEPS,
  isStripeIdentityConfigured,
} from "@/lib/workers/identity-verification-shared";
function publicDisplayName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Worker";
  if (parts.length === 1) return parts[0]!;
  const last = parts[parts.length - 1]!;
  return `${parts[0]} ${last.charAt(0).toUpperCase()}.`;
}

export async function getIdentityVerificationStatus(
  userId: string,
): Promise<IdentityVerificationStatusView | null> {
  const profile = await prisma.workerProfile.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      verificationStatus: true,
      workerScreeningStatus: true,
    },
  });
  if (!profile) return null;

  const stripeIdentityConfigured = isStripeIdentityConfigured();
  const verified = profile.verificationStatus === "verified";

  return {
    workerProfileId: profile.id,
    verificationStatus: profile.verificationStatus,
    workerScreeningStatus: profile.workerScreeningStatus,
    provider: stripeIdentityConfigured ? "stripe_identity" : "manual_review",
    stripeIdentityConfigured,
    canStart: !verified,
  };
}

/**
 * Starts participant-safe ID verification for the signed-in worker.
 * Until Stripe Identity is configured, marks credentials pending review and
 * writes an audit event for admin follow-up (no fake "verified" outcome).
 */
export async function startIdentityVerification(userId: string): Promise<{
  status: IdentityVerificationStatusView;
  message: string;
  nextStep: "await_provider" | "await_admin_review";
}> {
  const profile = await prisma.workerProfile.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  if (!profile) {
    throw new Error("WORKER_PROFILE_NOT_FOUND");
  }
  if (profile.verificationStatus === "verified") {
    const status = await getIdentityVerificationStatus(userId);
    return {
      status: status!,
      message: "Identity already verified.",
      nextStep: "await_provider",
    };
  }

  const stripeIdentityConfigured = isStripeIdentityConfigured();

  if (stripeIdentityConfigured) {
    // Stripe Identity session creation lands in a follow-up when keys are live.
    // Fail closed: do not redirect to a fake third-party URL.
    throw new Error("STRIPE_IDENTITY_NOT_IMPLEMENTED");
  }

  const updated = await prisma.workerProfile.update({
    where: { id: profile.id },
    data: {
      verificationStatus: "pending_review",
      workerScreeningStatus:
        profile.workerScreeningStatus === "not_provided"
          ? "pending_review"
          : profile.workerScreeningStatus,
    },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "worker_profile.identity_verification_started",
    entityType: "WorkerProfile",
    entityId: updated.id,
    organisationId: updated.organisationId,
    metadata: {
      provider: "manual_review",
      verificationStatus: updated.verificationStatus,
      workerScreeningStatus: updated.workerScreeningStatus,
      displayName: publicDisplayName(updated.displayName),
    },
  });

  return {
    status: {
      workerProfileId: updated.id,
      verificationStatus: updated.verificationStatus,
      workerScreeningStatus: updated.workerScreeningStatus,
      provider: "manual_review",
      stripeIdentityConfigured: false,
      canStart: true,
    },
    message:
      "Verification submitted for MapAble review. A provider or admin will confirm your ID check results.",
    nextStep: "await_admin_review",
  };
}
