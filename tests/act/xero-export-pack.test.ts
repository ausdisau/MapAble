import { describe, expect, it } from "vitest";

import { buildSafeXeroInvoicePayload } from "@/lib/xero/xero-invoice-service";

describe("Xero export pack honesty", () => {
  it("builds a safe payload without participant narrative", () => {
    const payload = buildSafeXeroInvoicePayload({
      id: "inv_123",
      lines: [
        {
          description: "Sensitive clinical note",
          quantity: 2,
          unitAmountCents: 1000,
        },
      ],
    });
    expect(payload.reference).toBe("inv_123");
    expect(payload.lineItems[0]?.description).toMatch(/Support services/);
    expect(payload.lineItems[0]?.description).not.toMatch(/clinical/i);
  });
});
