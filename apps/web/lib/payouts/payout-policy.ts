import { payoutPolicyDefaults } from "@/lib/payouts/config";

export type PlatformFeePolicy = {
  feeBps: number;
  zeroFeePilot: boolean;
};

export type ReservePolicy = {
  reserveBps: number;
  fixedReserveCents: number;
};

export function getPlatformFeePolicy(): PlatformFeePolicy {
  return {
    feeBps: payoutPolicyDefaults.zeroFeePilotMode
      ? 0
      : payoutPolicyDefaults.defaultPlatformFeeBps,
    zeroFeePilot: payoutPolicyDefaults.zeroFeePilotMode,
  };
}

export function getReservePolicy(): ReservePolicy {
  return {
    reserveBps: payoutPolicyDefaults.defaultReserveBps,
    fixedReserveCents: 0,
  };
}

export function transferGroupForBooking(bookingId: string): string {
  return `mapable_booking_${bookingId}`;
}

export function splitTransferIdempotencyKey(splitId: string): string {
  return `payout_split_transfer:${splitId}:v1`;
}
