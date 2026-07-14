import { describe, expect, it } from "vitest";

import { getCloudConfig } from "@/lib/platform/cloud-config";
import {
  ManagedQueueProvider,
  MemoryCacheProvider,
  RecordingQueueProvider,
  createMemoryCacheProvider,
  createQueueProvider,
  createRecordingQueueProvider,
} from "@/lib/platform/cloud-providers";
import { cloudEventEnvelopeSchema } from "@/lib/platform/event-outbox-service";

describe("CareOS cloud platform foundation", () => {
  it("fails production configuration with recording providers", () => {
    expect(() =>
      getCloudConfig({
        MAPABLE_ENVIRONMENT: "production",
        DATABASE_URL: "postgresql://example",
        DIRECT_URL: "postgresql://example",
        NEXTAUTH_SECRET: "a".repeat(32),
        CLOUD_STORAGE_PROVIDER: "recording",
        CLOUD_QUEUE_PROVIDER: "recording",
        CLOUD_CACHE_PROVIDER: "memory",
      }),
    ).toThrow();
  });

  it("records queue messages without an external effect", async () => {
    const queue = new RecordingQueueProvider();
    const receipt = await queue.publish("careos.missions", {
      missionId: "synthetic",
    });
    expect(receipt.messageId).toBeTruthy();
    expect(queue.messages).toHaveLength(1);
  });

  it("provides a deterministic cache fake", async () => {
    const cache = new MemoryCacheProvider();
    await cache.set("tenant:1", { enabled: true });
    expect(await cache.get("tenant:1")).toEqual({ enabled: true });
    await cache.delete("tenant:1");
    expect(await cache.get("tenant:1")).toBeNull();
  });

  it("validates tenant-scoped event envelopes", () => {
    expect(
      cloudEventEnvelopeSchema.parse({
        id: "bcd8d04c-efb2-47db-94e4-2e696213793a",
        type: "mission_created",
        version: 1,
        occurredAt: "2026-07-14T00:00:00.000Z",
        tenantId: "tenant-1",
        participantId: "participant-1",
        missionId: "mission-1",
        sourceModule: "careos",
        correlationId: "c23bf38c-fcf1-4624-a3b9-5e04342b1352",
        traceId: "trace-1",
        topic: "careos.missions",
        payload: {},
      }).tenantId,
    ).toBe("tenant-1");
  });

  it("exposes dev recording factories and managed queue without webhook", async () => {
    const queue = createRecordingQueueProvider();
    expect(queue).toBeInstanceOf(RecordingQueueProvider);
    const managed = createQueueProvider({
      CLOUD_QUEUE_PROVIDER: "managed",
    }) as ManagedQueueProvider;
    await managed.publish("careos.events", { test: true });
    expect(managed.recordedMessages).toHaveLength(1);
    expect(createMemoryCacheProvider()).toBeInstanceOf(MemoryCacheProvider);
  });
});
