import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { redactHandoffPayload } from "@/lib/act/handoff/redact";
import { __resetAuraMemoryForTests } from "@/lib/aura-harness/memory-store";
import { createHarnessSession } from "@/lib/aura-harness/session";

const createNotification = vi.fn();
const actHandoffCreate = vi.fn();
const actHandoffFindFirst = vi.fn();
const userFindFirst = vi.fn();

vi.mock("@/lib/notifications/notification-service", () => ({
  createNotification: (args: unknown) => createNotification(args),
}));

vi.mock("@/lib/db/transaction-service", () => ({
  runInTransaction: async <T>(fn: (tx: unknown) => Promise<T>) =>
    fn({
      actHandoff: {
        findFirst: (...args: unknown[]) => actHandoffFindFirst(...args),
        create: (...args: unknown[]) => actHandoffCreate(...args),
      },
      user: {
        findFirst: (...args: unknown[]) => userFindFirst(...args),
      },
    }),
}));

describe("Act A2H handoff", () => {
  beforeEach(async () => {
    vi.resetModules();
    await __resetAuraMemoryForTests();
    createNotification.mockReset();
    actHandoffCreate.mockReset();
    actHandoffFindFirst.mockReset();
    userFindFirst.mockReset();
    createNotification.mockResolvedValue({ id: "n1" });
    actHandoffFindFirst.mockResolvedValue(null);
    userFindFirst.mockResolvedValue({ id: "assignee-1" });
    actHandoffCreate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      id: "handoff-1",
      ...args.data,
      createdAt: new Date(),
      resolvedAt: null,
      resolveNote: null,
    }));
    process.env.MAPABLE_AURA_HARNESS_ENABLED = "true";
    process.env.MAPABLE_A2H_HANDOFF_ENABLED = "true";
  });

  afterEach(async () => {
    await __resetAuraMemoryForTests();
    delete process.env.MAPABLE_AURA_HARNESS_ENABLED;
    delete process.env.MAPABLE_A2H_HANDOFF_ENABLED;
  });

  it("redacts sensitive payload keys", () => {
    const redacted = redactHandoffPayload({
      tool: "bill",
      password: "secret",
      ndisNumber: "430000000",
      ok: true,
    });
    expect(redacted.password).toBe("[REDACTED]");
    expect(redacted.ndisNumber).toBe("[REDACTED]");
    expect(redacted.ok).toBe(true);
  });

  it("creates handoff on HITL_PENDING when A2H enabled", async () => {
    const { wrapToolsWithAuraHarness } = await import(
      "@/lib/aura-harness/wrap-tools"
    );
    const session = createHarnessSession();
    const execute = vi.fn(async () => ({ published: true }));
    const wrapped = wrapToolsWithAuraHarness(
      {
        publish_geospatial_update: {
          description: "publish",
          execute,
        },
      },
      { agentType: "matching", session, userId: "requester-1" },
    );

    const run = wrapped.publish_geospatial_update.execute as (input: {
      user_reports: string;
      medicalHistory: string;
      email: string;
    }) => Promise<unknown>;

    const result = await run({
      user_reports: "Jane Smith has epilepsy",
      medicalHistory: "diabetes",
      email: "a@b.com",
    });

    expect(execute).not.toHaveBeenCalled();
    expect(actHandoffCreate).toHaveBeenCalled();
    expect(createNotification).toHaveBeenCalled();
    expect(result).toMatchObject({
      aura: {
        blocked: true,
        pendingHumanReview: true,
        handoffId: "handoff-1",
      },
    });
  });
});
