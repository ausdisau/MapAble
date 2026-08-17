import { phase2Config } from "@/lib/config/phase2";
import { prisma } from "@/lib/prisma";
import type { BillingPreflightCheck } from "@/types/mapable-phase2";

export const SENSITIVE_WORDS = [
  "diagnosis",
  "medication",
  "psychiatric",
  "suicide",
  "self-harm",
  "abuse detail",
];

export function descriptionsContainSensitiveWords(
  descriptions: string[]
): boolean {
  return descriptions.some((desc) => {
    const lower = desc.toLowerCase();
    return SENSITIVE_WORDS.some((w) => lower.includes(w));
  });
}

export interface PreflightOutcome {
  status: "passed" | "failed";
  checks: Record<BillingPreflightCheck, boolean>;
  failedReasons: string[];
}

export async function runBillingPreflight(
  invoiceId: string
): Promise<PreflightOutcome> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: true, booking: true, participant: true },
  });

  if (!invoice) {
    return {
      status: "failed",
      checks: {} as Record<BillingPreflightCheck, boolean>,
      failedReasons: ["Invoice not found"],
    };
  }

  const checks: Record<string, boolean> = {};
  const failedReasons: string[] = [];

  checks.participant_exists = Boolean(invoice.participantId);
  if (!checks.participant_exists) {
    failedReasons.push("Participant record is missing on this invoice.");
  }

  checks.booking_exists = !invoice.bookingId || Boolean(invoice.booking);
  if (invoice.bookingId && !invoice.booking) {
    failedReasons.push("Linked booking could not be found.");
  }

  const bookingOk =
    !invoice.booking ||
    ["completed", "confirmed", "in_progress"].includes(invoice.booking.status);
  checks.booking_completed_or_admin_approved = bookingOk;
  if (!bookingOk) {
    failedReasons.push(
      "Booking must be confirmed, in progress, or completed before invoicing."
    );
  }

  checks.funding_source_exists = Boolean(invoice.fundingSourceId);
  if (!checks.funding_source_exists) {
    failedReasons.push("A funding source tag should be selected for review.");
  }

  checks.provider_exists = Boolean(invoice.organisationId);
  if (!checks.provider_exists) {
    failedReasons.push("A provider organisation should be linked.");
  }

  checks.invoice_lines_present = invoice.lines.length > 0;
  if (!checks.invoice_lines_present) {
    failedReasons.push("Add at least one invoice line.");
  }

  let sensitiveOk = true;
  for (const line of invoice.lines) {
    const lower = line.description.toLowerCase();
    if (SENSITIVE_WORDS.some((w) => lower.includes(w))) {
      sensitiveOk = false;
      failedReasons.push(
        "Line descriptions must not include sensitive health or disability details."
      );
      break;
    }
  }
  checks.no_sensitive_details_in_description = sensitiveOk;

  for (const line of invoice.lines) {
    if (line.claimableByNdis && !line.supportItemCode) {
      checks.support_item_present_if_ndis_claimable = false;
      failedReasons.push(
        "NDIS claimable lines need a support item code for review."
      );
      break;
    }
  }
  if (checks.support_item_present_if_ndis_claimable === undefined) {
    checks.support_item_present_if_ndis_claimable = true;
  }

  checks.amounts_are_positive =
    invoice.totalCents > 0 &&
    invoice.lines.every((l) => l.totalAmountCents > 0);
  if (!checks.amounts_are_positive) {
    failedReasons.push("All amounts must be greater than zero.");
  }

  checks.currency_is_aud = invoice.currency === phase2Config.billingDefaultCurrency;
  if (!checks.currency_is_aud) {
    failedReasons.push("Currency must be AUD in Phase 2.");
  }

  const status = failedReasons.length === 0 ? "passed" : "failed";
  return {
    status,
    checks: checks as Record<BillingPreflightCheck, boolean>,
    failedReasons,
  };
}
