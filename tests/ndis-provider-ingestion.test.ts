import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { verifyAdminCronBearer } from "@/lib/admin/cron-auth";
import {
  buildStableSourceId,
  extractProviderRecords,
  isTransientDbError,
  NDIS_PROVIDER_UPSERT_BATCH_SIZE,
  normaliseNdisProviderRecord,
  sha256Hex,
} from "@/lib/ingestion/ndis-providers";

describe("NDIS provider ingestion", () => {
  it("extracts provider array from wrapped payload", () => {
    const { records, sourceDate } = extractProviderRecords({
      date: "30 January 2026",
      data: [{ ABN: "1", Prov_N: "Test Co" }],
    });
    expect(records).toHaveLength(1);
    expect(sourceDate).toBe("30 January 2026");
  });

  it("normalises list-providers outlet shape", async () => {
    const fixture = join(
      process.cwd(),
      "tests",
      "fixtures",
      "ndis-list-providers-array.json",
    );
    const raw = JSON.parse(await readFile(fixture, "utf8")) as Record<
      string,
      unknown
    >[];
    const row = normaliseNdisProviderRecord(raw[0]!, 0);
    expect(row.providerName).toBe("Test Provider");
    expect(row.abn).toBe("123");
    expect(row.state).toBe("NSW");
    expect(row.registrationGroups.length).toBeGreaterThan(0);
    expect(row.rawHash).toBe(sha256Hex(JSON.stringify(raw[0])));
    expect(row.sourceId).toBeTruthy();
  });

  it("builds stable source_id from ABN when present", () => {
    const id = buildStableSourceId(
      { ABN: "12345678901", Outletname: "HQ" },
      0,
      { providerName: "Acme", abn: "12345678901", registrationNumber: null },
    );
    expect(id.startsWith("abn:")).toBe(true);
  });

  it("uses a conservative default upsert batch size", () => {
    expect(NDIS_PROVIDER_UPSERT_BATCH_SIZE).toBeLessThanOrEqual(50);
    expect(NDIS_PROVIDER_UPSERT_BATCH_SIZE).toBeGreaterThan(0);
  });

  it("detects transient Prisma connection errors for retry", () => {
    expect(
      isTransientDbError(
        Object.assign(new Error("Server has closed the connection."), {
          code: "P1017",
        }),
      ),
    ).toBe(true);
    expect(isTransientDbError(new Error("Unique constraint failed"))).toBe(
      false,
    );
  });

  it("verifyAdminCronBearer rejects missing token", () => {
    const prev = process.env.ADMIN_CRON_SECRET;
    process.env.ADMIN_CRON_SECRET = "test-secret";
    expect(
      verifyAdminCronBearer(
        new Request("http://localhost", {
          headers: { Authorization: "Bearer wrong" },
        }),
      ),
    ).toBe(false);
    expect(
      verifyAdminCronBearer(
        new Request("http://localhost", {
          headers: { Authorization: "Bearer test-secret" },
        }),
      ),
    ).toBe(true);
    process.env.ADMIN_CRON_SECRET = prev;
  });
});
