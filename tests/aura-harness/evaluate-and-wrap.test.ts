import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { evaluateToolAction } from "@/lib/aura-harness/evaluate-action";
import { __resetAuraMemoryForTests } from "@/lib/aura-harness/memory-store";
import { createHarnessSession } from "@/lib/aura-harness/session";
import { wrapToolsWithAuraHarness } from "@/lib/aura-harness/wrap-tools";

describe("evaluateToolAction", () => {
  beforeEach(() => {
    __resetAuraMemoryForTests();
    vi.stubEnv("MAPABLE_AURA_HARNESS_ENABLED", "true");
  });

  afterEach(() => {
    __resetAuraMemoryForTests();
    vi.unstubAllEnvs();
  });

  it("approves routine search", async () => {
    const result = await evaluateToolAction("searchNdisProviders", {
      q: "physio",
    });
    expect(result.decision.outcome).toBe("APPROVED");
    expect(result.decision.safeArgs).toEqual({ q: "physio" });
  });

  it("mitigates Low/High PII spikes on search tools", async () => {
    const result = await evaluateToolAction("searchNdisProviders", {
      q: "Jane Smith epilepsy diabetes support",
      email: "jane@example.com",
    });
    expect(result.decision.outcome).toBe("MITIGATED");
    expect(result.decision.safeArgs).toMatchObject({
      email: "[redacted]",
    });
  });

  it("denies High/Low destructive actions", async () => {
    const result = await evaluateToolAction("delete_user_account", {
      user_id: 1042,
    });
    expect(result.decision.outcome).toBe("DENIED");
    expect(result.decision.safeArgs).toBeUndefined();
  });

  it("fail-closes High/High publish of medical narratives", async () => {
    const result = await evaluateToolAction("publish_geospatial_update", {
      user_reports: "Jane Smith has epilepsy",
      medicalHistory: "diabetes",
      email: "a@b.com",
    });
    expect(result.decision.outcome).toBe("HITL_PENDING");
    expect(result.decision.profile.requiresHITL).toBe(true);
  });
});

describe("wrapToolsWithAuraHarness", () => {
  afterEach(() => {
    __resetAuraMemoryForTests();
    vi.unstubAllEnvs();
  });

  it("is a no-op when harness flag is off", async () => {
    vi.stubEnv("MAPABLE_AURA_HARNESS_ENABLED", "false");
    const session = createHarnessSession();
    const execute = vi.fn(async (input: { q: string }) => ({ ok: true, input }));
    const tools = {
      searchNdisProviders: {
        description: "search",
        execute,
      },
    };

    const wrapped = wrapToolsWithAuraHarness(tools, {
      agentType: "matching",
      session,
    });
    expect(wrapped.searchNdisProviders.execute).toBe(execute);
    const run = wrapped.searchNdisProviders.execute as (input: {
      q: string;
    }) => Promise<unknown>;
    await run({ q: "physio" });
    expect(execute).toHaveBeenCalledOnce();
    expect(session.summary.evaluations).toHaveLength(0);
  });

  it("does not call underlying execute when denied", async () => {
    vi.resetModules();
    vi.stubEnv("MAPABLE_AURA_HARNESS_ENABLED", "true");
    const { wrapToolsWithAuraHarness: wrap } = await import(
      "@/lib/aura-harness/wrap-tools"
    );
    const { createHarnessSession: createSession } = await import(
      "@/lib/aura-harness/session"
    );
    const { __resetAuraMemoryForTests: reset } = await import(
      "@/lib/aura-harness/memory-store"
    );
    reset();

    const execute = vi.fn(async () => ({ deleted: true }));
    const session = createSession();
    const wrapped = wrap(
      {
        delete_user_account: {
          description: "delete",
          execute,
        },
      },
      { agentType: "matching", session },
    );

    const run = wrapped.delete_user_account.execute as (input: {
      user_id: number;
    }) => Promise<unknown>;
    const result = await run({ user_id: 1 });
    expect(execute).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      aura: { blocked: true },
    });
    expect(session.humanReviewRequired() || session.toRiskTier() !== "low").toBe(
      true,
    );
  });

  it("accumulates risk tier for createAgentRun mapping", async () => {
    vi.resetModules();
    vi.stubEnv("MAPABLE_AURA_HARNESS_ENABLED", "true");
    const { wrapToolsWithAuraHarness: wrap } = await import(
      "@/lib/aura-harness/wrap-tools"
    );
    const { createHarnessSession: createSession } = await import(
      "@/lib/aura-harness/session"
    );
    const { __resetAuraMemoryForTests: reset } = await import(
      "@/lib/aura-harness/memory-store"
    );
    reset();

    const session = createSession();
    const wrapped = wrap(
      {
        publish_geospatial_update: {
          description: "publish",
          execute: async () => ({ published: true }),
        },
      },
      { agentType: "matching", session },
    );

    const run = wrapped.publish_geospatial_update.execute as (input: {
      user_reports: string;
      medicalHistory: string;
    }) => Promise<unknown>;
    await run({
      user_reports: "Jane Smith has epilepsy",
      medicalHistory: "diabetes",
    });

    expect(session.summary.requiresHITL).toBe(true);
    expect(session.toRiskTier()).toBe("critical");
    expect(session.humanReviewRequired()).toBe(true);
    expect(session.summary.guardrails.length).toBeGreaterThan(0);
  });
});
