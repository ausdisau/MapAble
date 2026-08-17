/** MapAble payout policy defaults — config-driven, not hardcoded in services. */
export const payoutPolicyDefaults = {
  currency: "aud",
  releaseMode: "service_attestation_required" as const,
  reviewWindowHours: 24,
  allowAutoReleaseAfterReviewWindow: false,
  requireAdminApprovalForFirstPayout: true,
  requireAdminApprovalForHighValuePayout: true,
  highValuePayoutThresholdCents: 100_000,
  blockOnOpenDispute: true,
  blockOnSafeguardingFlag: true,
  blockOnIncompleteRecipientOnboarding: true,
  blockOnMissingServiceAgreement: true,
  zeroFeePilotMode: true,
  defaultPlatformFeeBps: 0,
  maxPlatformFeeBps: 1800,
  defaultReserveBps: 0,
  useSeparateChargesAndTransfers: true,
  describeEscrowAs: "payout hold",
} as const;

export function isPayoutsEnabled(): boolean {
  return process.env.MAPABLE_PAYOUTS_ENABLED === "true";
}

export function isPayoutsAutoProcess(): boolean {
  return process.env.MAPABLE_PAYOUTS_AUTO_PROCESS === "true";
}

export function paymentsMode(): "test" | "live" {
  return process.env.MAPABLE_PAYMENTS_MODE === "live" ? "live" : "test";
}

export function connectReturnUrl(): string {
  return (
    process.env.STRIPE_CONNECT_RETURN_URL ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/payouts/onboarding/return`
  );
}

export function connectRefreshUrl(): string {
  return (
    process.env.STRIPE_CONNECT_REFRESH_URL ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/payouts/onboarding/refresh`
  );
}
