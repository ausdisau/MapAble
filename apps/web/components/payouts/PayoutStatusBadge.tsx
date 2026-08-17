import type { BillingPaymentSplitStatus, StripeOnboardingStatus } from "@prisma/client";

const STATUS_LABELS: Record<string, string> = {
  pending_service: "Pending service confirmation",
  ready: "Ready for transfer",
  blocked: "Blocked",
  transfer_created: "Transfer created",
  transferred: "Transferred",
  failed: "Failed",
  reversed: "Reversed",
  canceled: "Canceled",
  pending: "Pending",
};

export function PayoutStatusBadge({
  status,
}: {
  status: BillingPaymentSplitStatus | StripeOnboardingStatus | string;
}) {
  const label = STATUS_LABELS[status] ?? status.replace(/_/g, " ");
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium"
      aria-label={`Payout status: ${label}`}
    >
      <span className="sr-only">Status: </span>
      {label}
    </span>
  );
}
