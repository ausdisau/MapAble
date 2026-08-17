import { afterEach, describe, expect, it, vi } from "vitest";

const captureMock = vi.fn();
const flushMock = vi.fn().mockResolvedValue(undefined);
const posthogCtorMock = vi.fn(() => ({
  capture: captureMock,
  flush: flushMock,
}));

vi.mock("posthog-node", () => ({
  PostHog: posthogCtorMock,
}));

vi.mock("next/server", () => ({
  after: (callback: () => Promise<void>) => {
    void callback();
  },
}));

describe("llm-analytics", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
    captureMock.mockClear();
    flushMock.mockClear();
    posthogCtorMock.mockClear();
    vi.resetModules();
  });

  it("no-ops when POSTHOG_API_KEY is unset", async () => {
    process.env = { ...env, POSTHOG_API_KEY: "" };
    const { captureLlmGeneration } = await import("@/lib/analytics/llm-analytics");

    expect(() =>
      captureLlmGeneration({
        traceName: "search.parseQuery",
        model: "gemini-2.0-flash",
        provider: "google",
        latencyMs: 12,
        success: true,
      }),
    ).not.toThrow();

    expect(posthogCtorMock).not.toHaveBeenCalled();
    expect(captureMock).not.toHaveBeenCalled();
  });

  it("captures $ai_generation and flushes when configured", async () => {
    process.env = { ...env, POSTHOG_API_KEY: "phc_test_key" };
    const { captureLlmGeneration } = await import("@/lib/analytics/llm-analytics");

    captureLlmGeneration({
      traceName: "providerFinder.streamAssistant",
      model: "gemini-2.0-flash",
      provider: "google",
      latencyMs: 42,
      success: false,
      errorName: "StreamAborted",
      metadata: { query_length: 18 },
    });

    expect(posthogCtorMock).toHaveBeenCalledTimes(1);
    expect(captureMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "$ai_generation",
        properties: expect.objectContaining({
          $ai_trace_name: "providerFinder.streamAssistant",
          $ai_is_error: true,
          error_name: "StreamAborted",
          query_length: 18,
        }),
      }),
    );
    expect(flushMock).toHaveBeenCalledTimes(1);
  });
});

describe("getLlmAnalyticsProvider", () => {
  it("classifies gateway and google engine ids", async () => {
    const { getLlmAnalyticsProvider } = await import("@/lib/analytics/llm-analytics");

    expect(getLlmAnalyticsProvider("models/gateway/gemini-2.0-flash")).toBe(
      "vercel-ai-gateway",
    );
    expect(getLlmAnalyticsProvider("models/google/gemini-2.0-flash")).toBe(
      "google",
    );
    expect(getLlmAnalyticsProvider("custom-engine")).toBe("unknown");
  });
});
