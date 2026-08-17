import { afterEach, describe, expect, it, vi } from "vitest";

import { disabilityServicesToolNames } from "@/lib/agent/disability-services-tools";
import {
  DISABILITY_AGENT_OPERATIONS,
  disabilityAgentJsonError,
} from "@/lib/api/disability-agent-api-contract";
import { isDisabilityServicesAgentConfigured } from "@/lib/config/disability-services-agent";

describe("disability agent API contract", () => {
  it("exposes stable operationIds", () => {
    expect(DISABILITY_AGENT_OPERATIONS.mapableAskQuery).toBe("mapableAskQuery");
    expect(DISABILITY_AGENT_OPERATIONS.ndisProviderSearch).toBe(
      "ndisProviderSearch",
    );
    expect(DISABILITY_AGENT_OPERATIONS.disabilityServicesAgentTurn).toBe(
      "disabilityServicesAgentTurn",
    );
  });

  it("returns X-Operation-Id on errors", async () => {
    const res = disabilityAgentJsonError(
      DISABILITY_AGENT_OPERATIONS.disabilityServicesAgentTurn,
      503,
      {
        error: "Not enabled",
        code: "NOT_CONFIGURED",
        retryable: false,
      },
    );
    expect(res.headers.get("X-Operation-Id")).toBe(
      "disabilityServicesAgentTurn",
    );
    const body = (await res.json()) as { operationId: string };
    expect(body.operationId).toBe("disabilityServicesAgentTurn");
  });
});

describe("disability services agent config", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("is disabled unless explicitly enabled", () => {
    delete process.env.DISABILITY_SERVICES_AGENT_ENABLED;
    expect(isDisabilityServicesAgentConfigured()).toBe(false);
    process.env.DISABILITY_SERVICES_AGENT_ENABLED = "true";
    expect(isDisabilityServicesAgentConfigured()).toBe(true);
  });
});

describe("disability services tools", () => {
  it("maps tool names for agent observability", () => {
    expect(disabilityServicesToolNames.interpretFinderQuery).toBe(
      "interpretFinderQuery",
    );
    expect(disabilityServicesToolNames.geocodeLocation).toBe("geocodeLocation");
    expect(disabilityServicesToolNames.explainProvider).toBe("explainProvider");
  });
});

describe("explainProvider", () => {
  it("returns not found for empty input", async () => {
    const { explainProvider } = await import("@/lib/agent/tools/explain-provider");
    const result = await explainProvider({ providerName: "" });
    expect(result.found).toBe(false);
  });
});
