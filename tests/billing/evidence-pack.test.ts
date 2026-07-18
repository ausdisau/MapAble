import { describe, expect, it } from "vitest";

import { buildBillingEvidencePack } from "@/lib/billing/copilot/evidence-pack";

describe("Billing evidence pack", () => {
  it("cites agreement, booking, invoice and never auto-approves", () => {
    const pack = buildBillingEvidencePack({
      invoice: {
        id: "inv-1",
        number: "INV-100",
        status: "provider_review",
        totalCents: 40000,
        lineItems: [
          {
            id: "li-1",
            description: "Support",
            quantity: 4,
            unitAmountCents: 10000,
            bookingId: "b1",
          },
        ],
      },
      agreement: { id: "agr-1", version: "v3", hours: 2 },
      bookings: [{ id: "b1", hours: 2, label: "Shift booking" }],
      participantReview: { id: "pr-1", status: "pending" },
      pricingPolicyVersion: { id: "pp-1", version: "2026.1" },
    });

    expect(pack.actionTaken).toBe(false);
    expect(pack.requiresHumanConfirmation).toBe(true);
    expect(pack.editable).toBe(true);
    expect(pack.prohibited).toContain("automatic_invoice_approval");
    expect(pack.discrepancies.length).toBeGreaterThan(0);
    expect(
      pack.citations.some((c) => c.entityType === "CareServiceAgreement")
    ).toBe(true);
    expect(pack.citations.some((c) => c.entityType === "Booking")).toBe(true);
    expect(
      pack.suggestions.every((s) => s.requiresHumanConfirmation && s.editable)
    ).toBe(true);
    expect(
      pack.suggestions.some((s) => s.kind === "agreement_vs_invoice")
    ).toBe(true);
    expect(
      pack.suggestions.some((s) => s.kind === "participant_invoice_explanation")
    ).toBe(true);
  });

  it("flags missing agreement and duplicate candidates", () => {
    const pack = buildBillingEvidencePack({
      invoice: {
        id: "inv-2",
        number: "INV-200",
        status: "draft",
        totalCents: 1000,
        lineItems: [
          { id: "li-2", description: "A", quantity: 1, unitAmountCents: 1000 },
        ],
      },
      agreement: null,
      duplicateCandidates: [{ invoiceId: "inv-9", label: "INV-009" }],
      planManagerRejection: { reason: "Missing service agreement" },
    });
    expect(pack.missingEvidence.some((m) => /agreement/i.test(m))).toBe(true);
    expect(pack.suggestions.some((s) => s.kind === "duplicate_candidate")).toBe(
      true
    );
    expect(pack.suggestions.some((s) => s.kind === "plan_manager_followup")).toBe(
      true
    );
  });
});
