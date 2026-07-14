import { describe, expect, it, vi } from "vitest";

import { calculateWorkflowRetryAt } from "@/lib/platform/durable-workflow-service";
import { createDocumentSignedUrl } from "@/lib/platform/secure-document-service";
import { whereTenantOrganisations } from "@/lib/multi-tenant-admin/tenant-context";

vi.mock("@/lib/prisma", () => ({
  prisma: { document: { findFirst: vi.fn() } },
}));

describe("CareOS production foundation", () => {
  it("scopes tenant queries to verified organisation IDs", () => {
    expect(
      whereTenantOrganisations({
        tenantId: "tenant-1",
        organisationId: "org-1",
        organisationIds: ["org-1", "org-2"],
        enabled: true,
      }),
    ).toEqual({ organisation: { id: { in: ["org-1", "org-2"] } } });
  });

  it("calculates bounded workflow retry backoff using an injected clock", () => {
    const now = new Date("2026-07-14T00:00:00.000Z");
    expect(calculateWorkflowRetryAt(1, now).toISOString()).toBe(
      "2026-07-14T00:01:00.000Z",
    );
    expect(calculateWorkflowRetryAt(20, now).toISOString()).toBe(
      "2026-07-14T01:00:00.000Z",
    );
  });

  it("rejects unsafe signed URL expiry before storage access", async () => {
    await expect(
      createDocumentSignedUrl({
        storage: {
          putObject: vi.fn(),
          getObject: vi.fn(),
          createSignedUrl: vi.fn(),
          deleteObject: vi.fn(),
        },
        documentId: "document-1",
        actorUserId: "user-1",
        expiresInSeconds: 3600,
      }),
    ).rejects.toThrow("SIGNED_URL_EXPIRY_INVALID");
  });
});
