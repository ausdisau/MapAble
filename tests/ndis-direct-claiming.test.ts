import { describe, expect, it } from "vitest";

import { ndiaApiAdapterStub } from "@/lib/ndis/claiming/adapters/NdiaApiAdapter.stub";
import { checksumExport } from "@/lib/ndis/claiming/exporters/bulkPaymentRequestExporter";
import {
  fundingSourceToPaymentRoute,
  paymentRouteRequiresMyProviderCheck,
  paymentRouteUsesBulkExport,
} from "@/lib/ndis/claiming/paymentRoute";
import { FUNDING_ROUTE_LABELS } from "@/lib/ndis/claiming/types";

describe("NDIS payment routes", () => {
  it("maps funding source types", () => {
    expect(fundingSourceToPaymentRoute("ndis_self_managed")).toBe("self_managed");
    expect(fundingSourceToPaymentRoute("ndis_plan_managed")).toBe("plan_managed");
    expect(fundingSourceToPaymentRoute("ndis_agency_managed")).toBe("ndia_managed");
    expect(fundingSourceToPaymentRoute("private_pay")).toBeNull();
  });

  it("flags NDIA-managed bulk export and my provider checks", () => {
    expect(paymentRouteUsesBulkExport("ndia_managed")).toBe(true);
    expect(paymentRouteRequiresMyProviderCheck("ndia_managed")).toBe(true);
    expect(paymentRouteRequiresMyProviderCheck("self_managed")).toBe(false);
  });

  it("has plain-language route labels", () => {
    expect(FUNDING_ROUTE_LABELS.ndia_managed).toContain("NDIA");
  });
});

describe("bulk export checksum", () => {
  it("is stable for identical content", () => {
    const a = checksumExport("a,b\n1,2");
    const b = checksumExport("a,b\n1,2");
    expect(a).toBe(b);
  });
});

describe("NDIA API adapter stub", () => {
  it("throws when not configured", async () => {
    await expect(ndiaApiAdapterStub.submitClaimBatch("batch-1")).rejects.toThrow(
      "NDIA API access not configured"
    );
  });
});
