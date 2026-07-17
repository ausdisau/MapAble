import { createHash } from "crypto";

import { describe, expect, it } from "vitest";

import { participantSafeAiSummary } from "@/lib/ai-matching/ai-match-service";
import { hasPermission } from "@/lib/auth/permissions";
import { phase5Config } from "@/lib/config/phase5";
import { scopesAllow } from "@/lib/developer-api/api-key-service";
import { validatePriceRows } from "@/lib/ndis-pricing/catalogue-import-service";
import { isProviderEligibleForMatching } from "@/lib/provider-verification/verification-case-service";
import { safeStripeMetadata, hashApiKey } from "@/lib/stripe-billing/checkout-service";
import { buildSafeXeroInvoicePayload } from "@/lib/xero/xero-invoice-service";

describe("Phase 5 config", () => {
  it("disables AI matching by default", () => {
    expect(phase5Config.aiMatchingEnabled).toBe(false);
  });
  it("disables NDIA real submission by default", () => {
    expect(phase5Config.ndiaRealSubmissionEnabled).toBe(false);
  });
});

describe("AI matching safety", () => {
  it("marks low confidence for participant summary", () => {
    const s = participantSafeAiSummary({
      combinedScore: 0.4,
      lowConfidence: true,
      modelCommentaryScore: null,
    });
    expect(s.fit).toContain("review");
    expect(s.modelRan).toBe(false);
  });
});

describe("fairness and provider verification", () => {
  it("excludes suspended providers from matching", () => {
    expect(isProviderEligibleForMatching("suspended", "active")).toBe(false);
  });
});

describe("NDIS pricing validation", () => {
  it("rejects duplicate codes", () => {
    const errors = validatePriceRows([
      { code: "01_001", name: "A" },
      { code: "01_001", name: "B" },
    ]);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("Xero payload safety", () => {
  it("does not pass sensitive line descriptions", () => {
    const p = buildSafeXeroInvoicePayload({
      id: "inv1",
      lines: [{ description: "Private worker notes secret", quantity: 1, unitAmountCents: 100 }],
    });
    expect(p.lineItems[0].description).not.toContain("secret");
  });
});

describe("Stripe metadata safety", () => {
  it("uses safe metadata keys only", () => {
    const m = safeStripeMetadata({
      invoiceId: "inv1",
      userId: "u1",
      purpose: "participant_private_pay",
    });
    expect(JSON.stringify(m)).not.toContain("disability");
    expect(m.mapable_invoice_id).toBe("inv1");
  });
});

describe("developer API", () => {
  it("hashes API keys", () => {
    const h = hashApiKey("test-key");
    expect(h).toHaveLength(64);
    expect(h).toBe(createHash("sha256").update("test-key").digest("hex"));
  });
  it("enforces scopes", () => {
    expect(scopesAllow(["places_read"], "places_read")).toBe(true);
    expect(scopesAllow(["places_read"], "bookings_write")).toBe(false);
  });
});

describe("permissions", () => {
  it("grants admin AI matching", () => {
    expect(hasPermission("mapable_admin", "ai_matching:run")).toBe(true);
  });
  it("grants coordinator portal", () => {
    expect(hasPermission("support_coordinator", "coordinator:portal")).toBe(true);
  });
});
