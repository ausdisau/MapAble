import { randomUUID } from "crypto";

import type { BillingCopilotSuggestion } from "@/types/billing";

export type BillingEvidenceRecordRef = {
  entityType:
    | "CareServiceAgreement"
    | "Booking"
    | "TransportTrip"
    | "CareServiceLog"
    | "ParticipantReview"
    | "BillingInvoice"
    | "BillingInvoiceLineItem"
    | "PricingPolicyVersion"
    | "Payment"
    | "ReconciliationRecord";
  entityId: string;
  label: string;
  version?: string | null;
};

export type BillingEvidencePackInput = {
  invoice: {
    id: string;
    number: string;
    status: string;
    totalCents: number;
    lineItems: {
      id: string;
      description: string;
      quantity: number;
      unitAmountCents: number;
      bookingId?: string | null;
      transportTripId?: string | null;
      serviceLogId?: string | null;
    }[];
  };
  agreement?: {
    id: string;
    version: string;
    hours: number;
    supportItemCode?: string | null;
  } | null;
  bookings?: { id: string; hours: number; label: string }[];
  transportTrips?: { id: string; label: string; completed: boolean }[];
  serviceLogs?: { id: string; label: string }[];
  participantReview?: {
    id: string;
    status: "pending" | "confirmed" | "disputed";
  } | null;
  pricingPolicyVersion?: { id: string; version: string } | null;
  payments?: { id: string; amountCents: number }[];
  reconciliation?: {
    id: string;
    status: string;
    discrepancyCents?: number;
  } | null;
  planManagerRejection?: { reason: string } | null;
  duplicateCandidates?: { invoiceId: string; label: string }[];
};

export type BillingEvidencePack = {
  authorityCeiling: "DRAFT_ONLY";
  actionTaken: false;
  requiresHumanConfirmation: true;
  editable: true;
  summary: string;
  citations: BillingEvidenceRecordRef[];
  discrepancies: string[];
  missingEvidence: string[];
  suggestions: BillingCopilotSuggestion[];
  prohibited: readonly string[];
};

const PROHIBITED = [
  "automatic_invoice_approval",
  "payment_approval",
  "claim_approval",
  "support_item_selection_without_human",
  "change_rate",
  "change_funding_route",
  "send_messages_automatically",
] as const;

function sug(
  partial: Omit<
    BillingCopilotSuggestion,
    "editable" | "requiresHumanConfirmation" | "id"
  >
): BillingCopilotSuggestion {
  return {
    id: randomUUID(),
    ...partial,
    editable: true,
    requiresHumanConfirmation: true,
  };
}

/**
 * Build a cited billing evidence pack. Extends Billing Copilot — never auto-approves.
 */
export function buildBillingEvidencePack(
  input: BillingEvidencePackInput
): BillingEvidencePack {
  const citations: BillingEvidenceRecordRef[] = [
    {
      entityType: "BillingInvoice",
      entityId: input.invoice.id,
      label: input.invoice.number,
    },
    ...input.invoice.lineItems.map((l) => ({
      entityType: "BillingInvoiceLineItem" as const,
      entityId: l.id,
      label: l.description,
    })),
  ];

  if (input.agreement) {
    citations.push({
      entityType: "CareServiceAgreement",
      entityId: input.agreement.id,
      label: `Agreement ${input.agreement.version}`,
      version: input.agreement.version,
    });
  }
  for (const b of input.bookings ?? []) {
    citations.push({
      entityType: "Booking",
      entityId: b.id,
      label: b.label,
    });
  }
  for (const t of input.transportTrips ?? []) {
    citations.push({
      entityType: "TransportTrip",
      entityId: t.id,
      label: t.label,
    });
  }
  for (const s of input.serviceLogs ?? []) {
    citations.push({
      entityType: "CareServiceLog",
      entityId: s.id,
      label: s.label,
    });
  }
  if (input.participantReview) {
    citations.push({
      entityType: "ParticipantReview",
      entityId: input.participantReview.id,
      label: `Participant review (${input.participantReview.status})`,
    });
  }
  if (input.pricingPolicyVersion) {
    citations.push({
      entityType: "PricingPolicyVersion",
      entityId: input.pricingPolicyVersion.id,
      label: `Pricing policy ${input.pricingPolicyVersion.version}`,
      version: input.pricingPolicyVersion.version,
    });
  }
  for (const p of input.payments ?? []) {
    citations.push({
      entityType: "Payment",
      entityId: p.id,
      label: `Payment ${p.amountCents}c`,
    });
  }
  if (input.reconciliation) {
    citations.push({
      entityType: "ReconciliationRecord",
      entityId: input.reconciliation.id,
      label: `Reconciliation ${input.reconciliation.status}`,
    });
  }

  const discrepancies: string[] = [];
  const missingEvidence: string[] = [];
  const suggestions: BillingCopilotSuggestion[] = [];

  const invoiceHours = input.invoice.lineItems.reduce(
    (sum, l) => sum + l.quantity,
    0
  );

  if (!input.agreement) {
    missingEvidence.push("Service agreement record is missing.");
    suggestions.push(
      sug({
        kind: "missing_evidence",
        title: "Missing service agreement",
        body: "No service agreement version is attached to this evidence pack. A human must locate the agreement before approval.",
        citations: [
          {
            entityType: "BillingInvoice",
            entityId: input.invoice.id,
            label: input.invoice.number,
          },
        ],
        uncertainty: "high",
      })
    );
  } else if (Math.abs(input.agreement.hours - invoiceHours) > 0.01) {
    discrepancies.push(
      `Agreement hours (${input.agreement.hours}) differ from invoice line quantities (${invoiceHours}).`
    );
    suggestions.push(
      sug({
        kind: "agreement_vs_invoice",
        title: "Agreement versus invoice comparison",
        body: `Agreement ${input.agreement.version} records ${input.agreement.hours} hours; invoice lines total ${invoiceHours}. Editable draft for human review — no rate or funding changes applied.`,
        citations: [
          {
            entityType: "CareServiceAgreement",
            entityId: input.agreement.id,
            label: `Agreement ${input.agreement.version}`,
          },
          {
            entityType: "BillingInvoice",
            entityId: input.invoice.id,
            label: input.invoice.number,
          },
        ],
        uncertainty: "medium",
      })
    );
  }

  const bookingHours = (input.bookings ?? []).reduce((s, b) => s + b.hours, 0);
  if ((input.bookings?.length ?? 0) > 0 && Math.abs(bookingHours - invoiceHours) > 0.01) {
    discrepancies.push(
      `Booking hours (${bookingHours}) differ from invoice quantities (${invoiceHours}).`
    );
    suggestions.push(
      sug({
        kind: "booking_vs_line_item",
        title: "Booking versus line-item comparison",
        body: `Bookings total ${bookingHours} hours; invoice lines total ${invoiceHours}. Confirm before any human approval.`,
        citations: [
          ...(input.bookings ?? []).map((b) => ({
            entityType: "Booking" as const,
            entityId: b.id,
            label: b.label,
          })),
          {
            entityType: "BillingInvoice",
            entityId: input.invoice.id,
            label: input.invoice.number,
          },
        ],
        uncertainty: "medium",
      })
    );
  }

  if (!input.participantReview) {
    missingEvidence.push("Participant confirmation status is unknown.");
  } else if (input.participantReview.status === "disputed") {
    discrepancies.push("Participant review is disputed.");
  } else if (input.participantReview.status === "pending") {
    missingEvidence.push("Participant confirmation is still pending.");
  }

  if (input.reconciliation?.discrepancyCents) {
    discrepancies.push(
      `Reconciliation discrepancy of ${input.reconciliation.discrepancyCents} cents.`
    );
    suggestions.push(
      sug({
        kind: "reconciliation_discrepancy",
        title: "Reconciliation discrepancy explanation",
        body: `Reconciliation ${input.reconciliation.id} reports a ${input.reconciliation.discrepancyCents}c discrepancy. Draft for human investigation only.`,
        citations: [
          {
            entityType: "ReconciliationRecord",
            entityId: input.reconciliation.id,
            label: input.reconciliation.status,
          },
          {
            entityType: "BillingInvoice",
            entityId: input.invoice.id,
            label: input.invoice.number,
          },
        ],
        uncertainty: "medium",
      })
    );
  }

  if (input.planManagerRejection) {
    suggestions.push(
      sug({
        kind: "plan_manager_followup",
        title: "Plan-manager rejection explanation",
        body: `Plan manager rejection reason (draft): ${input.planManagerRejection.reason}. Do not resubmit without human confirmation.`,
        citations: [
          {
            entityType: "BillingInvoice",
            entityId: input.invoice.id,
            label: input.invoice.number,
          },
        ],
        uncertainty: "medium",
      })
    );
  }

  if (input.duplicateCandidates?.length) {
    suggestions.push(
      sug({
        kind: "duplicate_candidate",
        title: "Duplicate candidate explanation",
        body: `Possible duplicates: ${input.duplicateCandidates
          .map((d) => d.label)
          .join(", ")}. Human must confirm before any void/credit.`,
        citations: input.duplicateCandidates.map((d) => ({
          entityType: "BillingInvoice",
          entityId: d.invoiceId,
          label: d.label,
        })),
        uncertainty: "high",
      })
    );
  }

  suggestions.push(
    sug({
      kind: "evidence_pack_summary",
      title: "Invoice evidence-pack summary",
      body: `Evidence pack for ${input.invoice.number} (${input.invoice.status}). Citations: ${citations.length}. Discrepancies: ${discrepancies.length}. Missing: ${missingEvidence.length}. No approval or payment was performed.`,
      citations: citations.map((c) => ({
        entityType: c.entityType,
        entityId: c.entityId,
        label: c.label,
      })),
      uncertainty: discrepancies.length || missingEvidence.length ? "medium" : "low",
    })
  );

  suggestions.push(
    sug({
      kind: "participant_invoice_explanation",
      title: "Participant-facing invoice explanation",
      body: `Draft for participant: Invoice ${input.invoice.number} totals ${input.invoice.totalCents} cents across ${input.invoice.lineItems.length} line(s). ${
        input.participantReview
          ? `Your confirmation status is “${input.participantReview.status}”.`
          : "Your confirmation has not been recorded yet."
      } Please tell us if anything looks wrong. This message was not sent.`,
      citations: [
        {
          entityType: "BillingInvoice",
          entityId: input.invoice.id,
          label: input.invoice.number,
        },
      ],
      uncertainty: "low",
    })
  );

  suggestions.push(
    sug({
      kind: "provider_query",
      title: "Provider query draft",
      body: `Draft provider query (not sent): Please review evidence for invoice ${input.invoice.number}. ${
        discrepancies[0] ?? "Confirm line items against the service agreement and bookings."
      }`,
      citations: citations.slice(0, 5).map((c) => ({
        entityType: c.entityType,
        entityId: c.entityId,
        label: c.label,
      })),
      uncertainty: "medium",
    })
  );

  suggestions.push(
    sug({
      kind: "dispute_timeline",
      title: "Dispute chronology",
      body: [
        `Invoice ${input.invoice.number} status: ${input.invoice.status}.`,
        input.participantReview
          ? `Participant review: ${input.participantReview.status}.`
          : "Participant review: unknown.",
        input.planManagerRejection
          ? `Plan manager rejection noted.`
          : "No plan-manager rejection in pack.",
        "Chronology is a draft for human use only.",
      ].join(" "),
      citations: citations.map((c) => ({
        entityType: c.entityType,
        entityId: c.entityId,
        label: c.label,
      })),
      uncertainty: "medium",
    })
  );

  return {
    authorityCeiling: "DRAFT_ONLY",
    actionTaken: false,
    requiresHumanConfirmation: true,
    editable: true,
    summary: `Cited evidence pack for ${input.invoice.number} with ${citations.length} record references.`,
    citations,
    discrepancies,
    missingEvidence,
    suggestions,
    prohibited: PROHIBITED,
  };
}
