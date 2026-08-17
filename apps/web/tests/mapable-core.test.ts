import { describe, expect, it } from "vitest";

import { hasPermission, canViewParticipantProfile } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { consentScopeToPrisma, consentScopeFromPrisma } from "@/lib/consent/scope-map";
import { accessibilityProfileSchema } from "@/lib/validation/accessibility";
import { createBookingSchema } from "@/lib/validation/booking";

describe("role permission checks", () => {
  it("allows admin to manage organisations", () => {
    expect(hasPermission("mapable_admin", "organisation:manage")).toBe(true);
  });

  it("denies participant admin dashboard", () => {
    expect(hasPermission("participant", "admin:dashboard")).toBe(false);
  });

  it("allows participant to view own profile context", () => {
    expect(
      canViewParticipantProfile("participant", "user-1", "user-1")
    ).toBe(true);
  });

  it("identifies admin role", () => {
    expect(isAdminRole("mapable_admin")).toBe(true);
    expect(isAdminRole("participant")).toBe(false);
  });
});

describe("consent scope mapping", () => {
  it("maps consent scopes to prisma and back", () => {
    const scope = "accessibility.read" as const;
    const prismaScope = consentScopeToPrisma(scope);
    expect(consentScopeFromPrisma(prismaScope)).toBe(scope);
  });

  it("maps engagement delegate scopes", () => {
    expect(consentScopeToPrisma("engagement.read_delegate")).toBe(
      "engagement_read_delegate"
    );
    expect(consentScopeFromPrisma("engagement_submit_delegate")).toBe(
      "engagement.submit_delegate"
    );
  });
});

describe("booking creation validation", () => {
  it("requires booking type and start time", () => {
    const result = createBookingSchema.safeParse({
      bookingType: "care",
      requestedStart: "2026-06-01T09:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid booking type", () => {
    const result = createBookingSchema.safeParse({
      bookingType: "invalid",
      requestedStart: "2026-06-01T09:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});

describe("accessibility profile validation", () => {
  it("accepts mobility aids array", () => {
    const result = accessibilityProfileSchema.safeParse({
      mobilityNeeds: ["power_wheelchair"],
      communicationPreferences: ["plain_language"],
    });
    expect(result.success).toBe(true);
  });
});
