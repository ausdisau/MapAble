import { describe, expect, it } from "vitest";

import {
  isAuthFormPath,
  normalizeAuthEmail,
  safeAuthCallbackFromLocation,
  safeAuthCallbackPath,
} from "@/lib/auth/auth-flow";

describe("auth-flow helpers", () => {
  it("normalizes email", () => {
    expect(normalizeAuthEmail("  User@Example.COM ")).toBe("user@example.com");
  });

  it("allows safe relative callback paths", () => {
    expect(safeAuthCallbackPath("/dashboard/transport")).toBe(
      "/dashboard/transport",
    );
    expect(safeAuthCallbackPath(null)).toBe("/dashboard");
    expect(
      safeAuthCallbackPath("/provider-finder?q=therapy&location=Sydney"),
    ).toBe("/provider-finder?q=therapy&location=Sydney");
  });

  it("rejects open redirects and auth-form loops", () => {
    expect(safeAuthCallbackPath("//evil.com")).toBe("/dashboard");
    expect(safeAuthCallbackPath("https://evil.com")).toBe("/dashboard");
    expect(safeAuthCallbackPath("")).toBe("/dashboard");
    expect(safeAuthCallbackPath("/login")).toBe("/dashboard");
    expect(safeAuthCallbackPath("/register?plan=basic")).toBe("/dashboard");
    expect(safeAuthCallbackPath("/forgot-password")).toBe("/dashboard");
  });

  it("builds callbacks from the current location and query", () => {
    expect(
      safeAuthCallbackFromLocation(
        "/provider-finder",
        "?q=therapy&location=Sydney",
      ),
    ).toBe("/provider-finder?q=therapy&location=Sydney");
    expect(safeAuthCallbackFromLocation("/login", "?x=1")).toBe("/dashboard");
    expect(isAuthFormPath("/reset-password/abc")).toBe(true);
  });
});
