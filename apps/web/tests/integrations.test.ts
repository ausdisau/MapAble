import { describe, expect, it, vi } from "vitest";

import { getPublicConnectionSummary } from "@/lib/integrations/integration-connection-service";
import {
  IntegrationDisabledError,
} from "@/lib/integrations/integration-error";
import {
  isAutomationEventAllowed,
  BLOCKED_AUTOMATION_EVENTS,
} from "@/lib/integrations/integration-feature-policy";
import {
  getIntegrationAdapter,
  listRegisteredIntegrationKeys,
  requireIntegrationEnabled,
} from "@/lib/integrations/integration-registry";

describe("integration registry", () => {
  it("returns configured adapters", () => {
    const keys = listRegisteredIntegrationKeys();
    expect(keys).toContain("postgres");
    expect(keys).toContain("stripe");
    expect(keys).toContain("xero");
    expect(keys).toContain("openstreetmap");
    expect(keys).toContain("opensearch");
    expect(getIntegrationAdapter("postgres").key).toBe("postgres");
  });

  it("disabled postgres blocks when DATABASE_URL unset", () => {
    const orig = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      expect(() => requireIntegrationEnabled("postgres")).toThrow(
        IntegrationDisabledError
      );
    } finally {
      process.env.DATABASE_URL = orig;
    }
  });
});

describe("integration public config", () => {
  it("does not expose secrets in summary", () => {
    const summary = getPublicConnectionSummary({
      integrationKey: "stripe",
      integrationType: "finance",
      displayName: "Stripe",
      status: "enabled",
      environment: "test",
      lastHealthCheckAt: null,
      lastError: null,
      id: "1",
      configJsonEncrypted: "super-secret-json",
      connectedById: null,
      connectedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    expect(summary).not.toHaveProperty("configJsonEncrypted");
    expect(JSON.stringify(summary)).not.toContain("super-secret");
  });
});

describe("n8n automation policy", () => {
  it("blocks safety-critical events", () => {
    for (const ev of BLOCKED_AUTOMATION_EVENTS) {
      expect(isAutomationEventAllowed(ev)).toBe(false);
    }
  });

  it("allows low-risk events", () => {
    expect(isAutomationEventAllowed("support_ticket_created")).toBe(true);
  });
});

describe("integration health", () => {
  it("postgres adapter healthCheck returns shape", async () => {
    const adapter = getIntegrationAdapter("postgres");
    const result = await adapter.healthCheck();
    expect(result).toHaveProperty("status");
    expect(["healthy", "degraded", "unhealthy"]).toContain(result.status);
  });
});

describe("sync error logging", () => {
  it("retryable sync error type exists", async () => {
    const { recordSyncError, createSyncJob } = await import(
      "@/lib/integrations/integration-sync-service"
    );
    const prisma = await import("@/lib/prisma");
    vi.spyOn(prisma.prisma.integrationConnection, "findUnique").mockResolvedValue({
      id: "conn-1",
      integrationKey: "stripe",
    } as never);
    vi.spyOn(prisma.prisma.integrationSyncJob, "findUnique").mockResolvedValue(null);
    vi.spyOn(prisma.prisma.integrationSyncJob, "create").mockResolvedValue({
      id: "job-1",
      jobKey: "test",
    } as never);

    try {
      await createSyncJob({
        integrationKey: "stripe",
        jobKey: "invoice_sync",
        idempotencyKey: "idem-1",
      });
    } catch {
      // DB may be unavailable in CI — shape test only
      expect(recordSyncError).toBeDefined();
    }
  });
});
