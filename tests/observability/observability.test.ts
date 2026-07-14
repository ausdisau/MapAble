import { describe, expect, it } from "vitest";

import {
  aggregateHealthStatus,
  redactSensitiveContent,
} from "@/lib/platform/observability";
import {
  classifySecurityEvent,
  createSecurityEvent,
  exportSiemBatch,
} from "@/lib/platform/security-operations";

describe("observability redaction", () => {
  it("redacts connection strings", () => {
    const input = "Error: postgres://user:secret@host:5432/db failed";
    const result = redactSensitiveContent(input);
    expect(result).not.toContain("secret");
    expect(result).toContain("[REDACTED]");
  });

  it("redacts email addresses", () => {
    const input = "User admin@example.com logged in";
    const result = redactSensitiveContent(input);
    expect(result).not.toContain("admin@example.com");
  });

  it("redacts API keys", () => {
    const input = "api_key=sk_live_abc123xyz";
    const result = redactSensitiveContent(input);
    expect(result).not.toContain("sk_live");
  });
});

describe("health status aggregation", () => {
  it("returns critical when any check is critical", () => {
    expect(
      aggregateHealthStatus([
        { component: "a", region: "r", status: "ok", message: "", checkedAt: "" },
        { component: "b", region: "r", status: "critical", message: "", checkedAt: "" },
      ]),
    ).toBe("critical");
  });

  it("returns degraded when any check is degraded", () => {
    expect(
      aggregateHealthStatus([
        { component: "a", region: "r", status: "ok", message: "", checkedAt: "" },
        { component: "b", region: "r", status: "degraded", message: "", checkedAt: "" },
      ]),
    ).toBe("degraded");
  });

  it("returns ok when all checks ok", () => {
    expect(
      aggregateHealthStatus([
        { component: "a", region: "r", status: "ok", message: "", checkedAt: "" },
        { component: "b", region: "r", status: "ok", message: "", checkedAt: "" },
      ]),
    ).toBe("ok");
  });
});

describe("security operations", () => {
  it("classifies critical events", () => {
    expect(
      classifySecurityEvent({ type: "access.anomaly", message: "Suspected data breach" }),
    ).toBe("critical");
  });

  it("creates redacted security events", () => {
    const event = createSecurityEvent({
      type: "auth.failed",
      source: "api",
      message: "Failed login for user@test.com with token=abc123",
    });
    expect(event.message).not.toContain("user@test.com");
    expect(event.severity).toBe("warning");
  });

  it("exports SIEM batch with redaction flag", () => {
    const batch = exportSiemBatch([
      createSecurityEvent({
        type: "test",
        source: "test",
        message: "api_key=secret123",
      }),
    ]);
    expect(batch.redacted).toBe(true);
    expect(batch.events[0].message).not.toContain("secret123");
  });
});
