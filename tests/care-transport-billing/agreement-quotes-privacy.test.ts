import { describe, expect, it, beforeEach } from "vitest";

import {
  __resetTransportQuotesForTests,
  acceptTransportQuote,
  createTransportQuote,
  getTransportQuote,
} from "@/lib/transport/quotes/quote-service";
import { projectLocationForStage } from "@/lib/transport/privacy/location-disclosure";

describe("transport quotes", () => {
  beforeEach(() => {
    __resetTransportQuotesForTests();
  });

  it("creates versioned quotes with funding disclaimer and accepts for participant", () => {
    const quote = createTransportQuote({
      organisationId: "org-a",
      participantUserId: "taylor",
      providerLabel: "Harbour Accessible Transport",
      components: [
        { code: "base", label: "Base fare", amountCents: 4500 },
        { code: "access", label: "Access support", amountCents: 1500 },
      ],
      accessibilityAssumptions: ["WAV vehicle assumed — not guaranteed"],
    });
    expect(quote.version).toBe(1);
    expect(quote.totalCents).toBe(6000);
    expect(quote.fundingDisclaimer.toLowerCase()).toContain("not ndis funding");
    expect(quote.status).toBe("proposed");

    const accepted = acceptTransportQuote({
      quoteId: quote.id,
      participantUserId: "taylor",
    });
    expect(accepted.status).toBe("accepted");
    expect(accepted.acceptedAt).toBeTruthy();
  });

  it("expires proposed quotes past expiresAt", () => {
    const quote = createTransportQuote({
      organisationId: "org-a",
      participantUserId: "taylor",
      providerLabel: "Provider",
      components: [{ code: "base", label: "Base", amountCents: 100 }],
      ttlMinutes: 5,
    });
    const stored = getTransportQuote(quote.id)!;
    stored.expiresAt = new Date(Date.now() - 1000).toISOString();
    const expired = getTransportQuote(quote.id);
    expect(expired?.status).toBe("expired");
  });
});

describe("location disclosure", () => {
  it("redacts exact address before acceptance for provider/driver", () => {
    const view = projectLocationForStage({
      stage: "quote",
      suburb: "Pyrmont",
      exactAddress: "1 Harbour St",
      role: "provider",
    });
    expect(view.redacted).toBe(true);
    expect(view.exactAddress).toBeUndefined();
    expect(view.label).toBe("Pyrmont");
  });

  it("reveals exact address to assigned driver in service window", () => {
    const view = projectLocationForStage({
      stage: "assigned",
      suburb: "Pyrmont",
      exactAddress: "1 Harbour St",
      role: "driver",
    });
    expect(view.redacted).toBe(false);
    expect(view.exactAddress).toBe("1 Harbour St");
  });
});
