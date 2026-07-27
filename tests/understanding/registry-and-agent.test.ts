import { afterEach, describe, expect, it } from "vitest";

import { getAiCapability } from "@/lib/ai/platform/capabilities/registry";
import { getPrompt } from "@/lib/ai/platform/prompts/registry";
import { isModelAllowedForTask } from "@/lib/ai/platform/models/registry";
import { createUnderstandingAgent } from "@/lib/understanding/understanding-agent";

describe("Understanding registry + agent gate", () => {
  const prev = process.env.MAPABLE_UNDERSTANDING_ENABLED;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.MAPABLE_UNDERSTANDING_ENABLED;
    } else {
      process.env.MAPABLE_UNDERSTANDING_ENABLED = prev;
    }
  });

  it("registers DDA/NDIS prompt with prohibited SDA determination", () => {
    const prompt = getPrompt("understanding.dda_ndis_context");
    expect(prompt).toBeDefined();
    expect(prompt?.prohibitedBehaviours).toContain(
      "determine_sda_sil_eligibility",
    );
    expect(prompt?.systemInstructions).toMatch(/Disability Discrimination Act/i);
    expect(prompt?.systemInstructions).toMatch(/NDIS/i);
  });

  it("registers understanding.contextual capability and model allowlist", () => {
    const cap = getAiCapability("understanding.contextual");
    expect(cap?.featureFlag).toBe("MAPABLE_UNDERSTANDING_ENABLED");
    expect(cap?.backend).toBe("model_backed");
    expect(
      isModelAllowedForTask("google/gemini-3.5-flash", "understanding.contextual"),
    ).toBe(true);
  });

  it("refuses agent creation when Understanding flag is off", () => {
    process.env.MAPABLE_UNDERSTANDING_ENABLED = "false";
    expect(() => createUnderstandingAgent("user-1")).toThrow(
      /UNDERSTANDING_DISABLED/,
    );
  });
});
