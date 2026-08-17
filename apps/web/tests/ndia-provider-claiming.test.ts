import { describe, expect, it } from "vitest";

import type { NdiaProviderClaimPayload } from "@/lib/ndis/provider-claiming/types";
import {
  mapBillingFundingType,
  validateFundingForProviderClaim,
  hasBlockingFindings,
} from "@/lib/ndis/provider-claiming/validate";

describe("registered provider funding rules", () => {
  it("blocks plan-managed claims", () => {
    const findings = validateFundingForProviderClaim("ndis_plan_managed");
    expect(hasBlockingFindings(findings)).toBe(true);
    expect(findings.some((f) => f.code === "plan_managed")).toBe(true);
  });

  it("allows agency-managed with guidance", () => {
    const findings = validateFundingForProviderClaim("ndis_agency_managed");
    expect(hasBlockingFindings(findings)).toBe(false);
  });

  it("maps billing funding types", () => {
    expect(mapBillingFundingType("ndis_plan_managed")).toBe("ndis_plan_managed");
    expect(mapBillingFundingType("private_card")).toBe("ndis_agency_managed");
  });
});

describe("claim payload shape", () => {
  it("includes registered provider metadata", () => {
    const payload: NdiaProviderClaimPayload = {
      claimType: "registered_provider",
      provider: {
        abn: "123",
        ndisRegistrationNumber: "4050000001",
        organisationId: "org1",
        name: "Test Provider",
      },
      participant: {
        ndisNumber: null,
        ndisNumberMasked: "****0001",
        mapableUserId: "user1",
      },
      invoiceReference: { mapableLegacyInvoiceId: "inv1" },
      servicePeriod: { start: "2026-01-01", end: "2026-01-31" },
      lines: [
        {
          lineNumber: 1,
          supportItemCode: "01_011_0107_1_1",
          description: "Personal care",
          serviceDate: "2026-01-15",
          quantity: 2,
          unitPriceCents: 6500,
          totalCents: 13000,
          gstIncluded: false,
        },
      ],
      totals: {
        subtotalCents: 13000,
        taxCents: 0,
        totalCents: 13000,
        currency: "AUD",
      },
      metadata: { builtAt: new Date().toISOString(), mapableVersion: "1" },
    };
    expect(payload.claimType).toBe("registered_provider");
    expect(payload.lines).toHaveLength(1);
  });
});
