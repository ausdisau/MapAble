import { describe, expect, it } from "vitest";

import {
  getClaimsGateway,
  MockClaimsGateway,
  OfficialDisabledClaimsGateway,
} from "@/lib/billing/claims/gateway";

describe("ClaimsGateway adapters", () => {
  it("official gateway remains disabled and never pretends live submit", async () => {
    const gateway = new OfficialDisabledClaimsGateway();
    const validation = await gateway.validate("batch_x");
    expect(validation.valid).toBe(false);
    expect(validation.simulated).toBe(true);

    const submission = await gateway.submit("batch_x");
    expect(submission.simulated).toBe(true);
    expect(submission.message).toMatch(/disabled|SIMULATED/i);
    expect(submission.status).toBe("NOT_READY");
  });

  it("factory resolves known gateways", () => {
    expect(getClaimsGateway("mock")).toBeInstanceOf(MockClaimsGateway);
    expect(getClaimsGateway("official_disabled")).toBeInstanceOf(
      OfficialDisabledClaimsGateway
    );
    expect(getClaimsGateway("unknown")).toBeInstanceOf(
      OfficialDisabledClaimsGateway
    );
  });
});
