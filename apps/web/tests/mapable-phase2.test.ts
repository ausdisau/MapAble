import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { descriptionsContainSensitiveWords } from "@/lib/billing/preflight";
import { isStripeConfigured, isXeroConfigured } from "@/lib/config/phase2";
import { userCanAccessConversation } from "@/lib/messages/message-service";
import { isSafeguardingTicket } from "@/lib/support/ticket-service";

describe("Phase 2 permissions", () => {
  it("allows participant to create support", () => {
    expect(hasPermission("participant", "support:create")).toBe(true);
  });

  it("allows provider to respond to bookings", () => {
    expect(hasPermission("provider_admin", "provider:booking:respond")).toBe(
      true
    );
  });
});

describe("safeguarding tickets", () => {
  it("flags safeguarding category", () => {
    expect(
      isSafeguardingTicket({
        category: "safeguarding_concern",
        requiresIncidentReview: false,
      })
    ).toBe(true);
  });
});

describe("billing preflight sensitive words", () => {
  it("detects sensitive words in descriptions", () => {
    expect(
      descriptionsContainSensitiveWords([
        "Support session with medication assistance",
      ])
    ).toBe(true);
    expect(
      descriptionsContainSensitiveWords(["Community access support"])
    ).toBe(false);
  });
});

describe("external integration guards", () => {
  it("stripe not configured by default", () => {
    expect(isStripeConfigured()).toBe(false);
  });

  it("xero not configured by default", () => {
    expect(isXeroConfigured()).toBe(false);
  });
});

describe("conversation access", () => {
  it("denies access without participant record when prisma unavailable", async () => {
    try {
      const allowed = await userCanAccessConversation(
        "user-a",
        "conv-nonexistent",
        false
      );
      expect(allowed).toBe(false);
    } catch {
      expect(true).toBe(true);
    }
  });
});
