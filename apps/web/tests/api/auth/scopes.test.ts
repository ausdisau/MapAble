import { describe, expect, it } from "vitest";

import { scopesAllow } from "@/lib/developer-api/api-key-service";
import { developerPlatformConfig } from "@/lib/config/developer-platform";
import { scopeAllows } from "@/lib/platform/developer-auth/api-key-auth";

describe("Developer platform config", () => {
  it("is disabled by default", () => {
    expect(developerPlatformConfig.enabled).toBe(false);
    expect(developerPlatformConfig.partnerWebhooksEnabled).toBe(false);
  });

  it("blocks service account participant authority", () => {
    expect(developerPlatformConfig.serviceAccountParticipantAuthorityEnabled).toBe(
      false,
    );
  });
});

describe("API scope enforcement", () => {
  it("allows granted scopes", () => {
    expect(scopesAllow(["places_read", "bookings_read"], "places_read")).toBe(
      true,
    );
  });

  it("denies missing scopes", () => {
    expect(scopesAllow(["places_read"], "bookings_write")).toBe(false);
    expect(scopeAllows(["places_read"], "bookings_write")).toBe(false);
  });
});

describe("Platform disabled guard", () => {
  it("throws when platform disabled", async () => {
    const { ensureDeveloperPlatformEnabled } = await import(
      "@/lib/config/developer-platform"
    );
    if (developerPlatformConfig.enabled) {
      expect(true).toBe(true);
      return;
    }
    expect(() => ensureDeveloperPlatformEnabled()).toThrow(
      "DEVELOPER_PLATFORM_DISABLED",
    );
  });
});
