import type { BillingPaymentSplitRecipient } from "@prisma/client";

import { getPlatformFeePolicy, getReservePolicy } from "@/lib/payouts/payout-policy";
import type {
  CalculatePayoutSplitsInput,
  CalculatePayoutSplitsResult,
  PayoutSplitDraft,
} from "@/lib/payouts/types";

function mapRecipientType(
  type: string
): BillingPaymentSplitRecipient {
  switch (type) {
    case "support_worker":
      return "worker";
    case "provider_org":
      return "provider";
    case "transport_operator":
      return "transport_operator";
    case "mapable_platform":
      return "mapable_platform";
    default:
      return "provider";
  }
}

export function calculatePayoutSplits(
  input: CalculatePayoutSplitsInput
): CalculatePayoutSplitsResult {
  const validationErrors: string[] = [];
  const warnings: string[] = [];
  const platformPolicy = input.platformFeePolicy ?? getPlatformFeePolicy();
  const reservePolicy = input.reservePolicy ?? getReservePolicy();

  if (input.grossAmountCents <= 0) {
    validationErrors.push("Gross amount must be greater than zero.");
  }

  if (input.serviceCompletionStatus === "disputed") {
    validationErrors.push("Cannot calculate payout splits while service is disputed.");
  }

  const splits: PayoutSplitDraft[] = [];
  let allocatedCents = 0;

  if (input.recipients.length === 0 && input.lineItems.length > 0) {
    for (const line of input.lineItems) {
      if (line.lineType === "platform_fee") continue;
      const role = line.lineType === "transport"
        ? "transport_operator"
        : line.lineType === "worker_service"
          ? "worker"
          : "provider";
      splits.push({
        recipientType: role,
        recipientId: line.recipientId,
        grossShareCents: line.totalAmountCents,
        platformFeeCents: 0,
        adjustmentsCents: 0,
        reserveCents: 0,
        netTransferCents: line.totalAmountCents,
        role,
      });
      allocatedCents += line.totalAmountCents;
    }
  } else {
    for (const recipient of input.recipients) {
      const role = mapRecipientType(recipient.recipientType);
      const lineTotal = input.lineItems
        .filter((li) => li.recipientId === recipient.recipientId)
        .reduce((sum, li) => sum + li.totalAmountCents, 0);
      const grossShareCents =
        lineTotal > 0
          ? lineTotal
          : Math.floor(input.grossAmountCents / input.recipients.length);

      let platformFeeCents = 0;
      if (!platformPolicy.zeroFeePilot && role === "worker") {
        platformFeeCents = Math.floor(
          (grossShareCents * platformPolicy.feeBps) / 10_000
        );
      }

      const reserveCents =
        (reservePolicy.fixedReserveCents ?? 0) > 0
          ? (reservePolicy.fixedReserveCents ?? 0)
          : Math.floor((grossShareCents * reservePolicy.reserveBps) / 10_000);

      const netTransferCents = Math.max(
        0,
        grossShareCents - platformFeeCents - reserveCents
      );

      splits.push({
        recipientType: role,
        recipientId: recipient.recipientId,
        payoutRecipientId: recipient.payoutRecipientId,
        grossShareCents,
        platformFeeCents,
        adjustmentsCents: 0,
        reserveCents,
        netTransferCents,
        role,
      });
      allocatedCents += grossShareCents;
    }
  }

  if (!platformPolicy.zeroFeePilot) {
    const platformFeeFromLines = input.lineItems
      .filter((li) => li.lineType === "platform_fee")
      .reduce((sum, li) => sum + li.totalAmountCents, 0);
    const platformFeeCents =
      platformFeeFromLines > 0
        ? platformFeeFromLines
        : Math.floor((input.grossAmountCents * platformPolicy.feeBps) / 10_000);
    if (platformFeeCents > 0) {
      splits.push({
        recipientType: "mapable_platform",
        grossShareCents: platformFeeCents,
        platformFeeCents: 0,
        adjustmentsCents: 0,
        reserveCents: 0,
        netTransferCents: platformFeeCents,
        role: "mapable_platform",
      });
    }
  }

  if (allocatedCents > input.grossAmountCents) {
    validationErrors.push(
      "Allocated recipient shares exceed the gross payment amount."
    );
  } else if (allocatedCents < input.grossAmountCents) {
    warnings.push(
      "Recipient shares do not fully allocate the gross payment amount."
    );
  }

  const totalPlatformFeeCents = splits.reduce(
    (sum, s) => sum + s.platformFeeCents,
    0
  );
  const totalReserveCents = splits.reduce((sum, s) => sum + s.reserveCents, 0);
  const totalNetTransferCents = splits
    .filter((s) => s.role !== "mapable_platform")
    .reduce((sum, s) => sum + s.netTransferCents, 0);

  return {
    splits,
    totalGrossCents: input.grossAmountCents,
    totalPlatformFeeCents,
    totalReserveCents,
    totalNetTransferCents,
    validationErrors,
    warnings,
  };
}
