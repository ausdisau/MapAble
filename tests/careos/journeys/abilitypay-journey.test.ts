import { describe, expect, it } from "vitest";

import { reconcileInvoiceDeterministically } from "@/lib/abilitypay/abilitypay-service";
import {
  assertJourneySafeDefaults,
  orchestrateAbilityPayJourney,
} from "@/lib/careos/journey-stubs";

describe("AbilityPay reconciliation journey", () => {
  it("orchestration stub requires participant confirmation with AI disabled", () => {
    const result = orchestrateAbilityPayJourney();
    assertJourneySafeDefaults(result);
    expect(result.humanReviewRequired).toBe(true);
  });

  it("deterministic reconcile never auto-settles discrepancies", () => {
    const outcome = reconcileInvoiceDeterministically({
      invoiceId: "inv-1",
      invoicedTotalCents: 10_000,
      expectedTotalCents: 8_000,
      serviceEvidencePresent: true,
    });
    expect(outcome.overallStatus).toBe("participant_review");
    expect(outcome.differences.length).toBeGreaterThan(0);
  });
});
