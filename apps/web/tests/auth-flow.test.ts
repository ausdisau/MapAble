import { describe, expect, it } from "vitest";

import {
  normalizeAuthEmail,
  safeAuthCallbackPath,
} from "@/lib/auth/auth-flow";

describe("auth-flow helpers", () => {
  it("normalizes email", () => {
    expect(normalizeAuthEmail("  User@Example.COM ")).toBe("user@example.com");
  });

  it("allows safe relative callback paths", () => {
    expect(safeAuthCallbackPath("/dashboard/transport")).toBe(
      "/dashboard/transport"
    );
    expect(safeAuthCallbackPath(null)).toBe("/dashboard");
  });

  it("rejects open redirects", () => {
    expect(safeAuthCallbackPath("//evil.com")).toBe("/dashboard");
    expect(safeAuthCallbackPath("https://evil.com")).toBe("/dashboard");
    expect(safeAuthCallbackPath("")).toBe("/dashboard");
  });
});
