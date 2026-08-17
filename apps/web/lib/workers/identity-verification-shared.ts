import type { WorkerCredentialStatus } from "@prisma/client";

export type IdentityVerificationProvider = "manual_review" | "stripe_identity";

export type IdentityVerificationStatusView = {
  workerProfileId: string;
  verificationStatus: WorkerCredentialStatus;
  workerScreeningStatus: WorkerCredentialStatus;
  provider: IdentityVerificationProvider;
  stripeIdentityConfigured: boolean;
  canStart: boolean;
};

export function isStripeIdentityConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    env.STRIPE_IDENTITY_ENABLED === "true" &&
    Boolean(env.STRIPE_SECRET_KEY?.trim())
  );
}

/** Participant-facing steps shown on /worker/verify-id (Replit IDVerificationFlow). */
export const IDENTITY_VERIFICATION_STEPS = [
  "Worker initiates ID verification",
  "Redirect to third-party service (e.g., Stripe Identity, IDVerse)",
  "Upload ID and selfie for liveness check",
  "Third-party validates ID and returns result",
  "Verification result stored in backend",
  "Worker profile updated (badge shown)",
  "Optional: Cross-check with NDIS Worker Screening DB",
  "Audit log saved with timestamp",
] as const;
