import { describe, expect, it } from "vitest";

import {
  getRealtimeProvider,
  subscribeToConversation,
} from "@/lib/realtime/supabase-realtime-adapter";
import {
  IDENTITY_VERIFICATION_STEPS,
  isStripeIdentityConfigured,
} from "@/lib/workers/identity-verification-shared";
import {
  AU_JURISDICTIONS,
} from "@/lib/workers/worker-screening-service";
import screeningFixture from "./fixtures/screening-verifications.json";
import mockMessages from "./fixtures/mock-messages.json";

describe("worker identity verification (Replit port)", () => {
  it("exposes the participant-safe verification steps", () => {
    expect(IDENTITY_VERIFICATION_STEPS).toHaveLength(8);
    expect(IDENTITY_VERIFICATION_STEPS[0]).toMatch(/initiates/i);
  });

  it("keeps Stripe Identity fail-closed by default", () => {
    expect(isStripeIdentityConfigured({} as NodeJS.ProcessEnv)).toBe(false);
    expect(
      isStripeIdentityConfigured({
        STRIPE_IDENTITY_ENABLED: "true",
        STRIPE_SECRET_KEY: "",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
  });
});

describe("worker screening (Replit port)", () => {
  it("lists Australian jurisdictions", () => {
    expect(AU_JURISDICTIONS).toContain("NSW");
    expect(AU_JURISDICTIONS).toContain("ACT");
    expect(AU_JURISDICTIONS).toHaveLength(8);
  });

  it("loads screening fixture shape from Replit mock", () => {
    expect(Array.isArray(screeningFixture)).toBe(true);
    expect(screeningFixture[0]).toMatchObject({
      name: expect.any(String),
      jurisdiction: expect.any(String),
      status: expect.any(String),
    });
  });
});

describe("messaging fixtures and realtime adapter", () => {
  it("loads Replit mock messages fixture", () => {
    expect(mockMessages.length).toBeGreaterThan(0);
    expect(mockMessages[0]).toHaveProperty("body");
  });

  it("defaults realtime provider to polling", () => {
    expect(getRealtimeProvider()).toBe("polling");
    const unsub = subscribeToConversation("conv_1", () => undefined);
    expect(typeof unsub).toBe("function");
    unsub();
  });
});
