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
    expect(safeAuthCallbackPath("/\\external.example/path")).toBe("/dashboard");
    expect(safeAuthCallbackPath("/\\\\external.example")).toBe("/dashboard");
    expect(safeAuthCallbackPath("/dashboard\nnext")).toBe("/dashboard");
    expect(safeAuthCallbackPath("/dashboard\u0000x")).toBe("/dashboard");
    expect(safeAuthCallbackPath("/dashboard", "//bad.example")).toBe(
      "/dashboard",
    );
  });

  it("keeps safe local paths, query strings, and fragments", () => {
    expect(safeAuthCallbackPath("/dashboard?tab=care#summary")).toBe(
      "/dashboard?tab=care#summary",
    );
  });
});
