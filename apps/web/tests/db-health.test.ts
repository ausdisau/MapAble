import { describe, expect, it } from "vitest";

import { postgresAdapter } from "@/lib/integrations/adapters/postgres-adapter";
import { getStorageBackend } from "@/lib/storage/document-storage-service";

describe("db and storage health", () => {
  it("postgres adapter returns health shape", async () => {
    const h = await postgresAdapter.healthCheck();
    expect(h.status).toBeDefined();
  });

  it("storage backend defaults to local", () => {
    expect(getStorageBackend()).toBe("local");
  });
});
