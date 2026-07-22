import { describe, expect, it } from "vitest";

import {
  classifySafeError,
  createCorrelationId,
  resolveCorrelationId,
} from "@/lib/security/request-correlation";

describe("request correlation", () => {
  it("creates and resolves correlation ids safely", () => {
    const id = createCorrelationId();
    expect(id.length).toBeGreaterThan(8);
    expect(resolveCorrelationId(id)).toBe(id);
    expect(resolveCorrelationId("bad id with spaces")).not.toBe(
      "bad id with spaces",
    );
  });

  it("classifies errors without leaking messages", () => {
    expect(classifySafeError({ status: 401, name: "AuthError" })).toBe(
      "auth_failure",
    );
    expect(classifySafeError({ status: 429 })).toBe("rate_limited");
    expect(classifySafeError({ status: 503, name: "Timeout" })).toBe(
      "dependency_unavailable",
    );
    expect(classifySafeError(new Error("postgres://user:pass@host/db"))).toBe(
      "internal",
    );
  });
});
