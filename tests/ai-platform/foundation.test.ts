import { beforeEach, describe, expect, it } from "vitest";

import {
  assertApprovalBindingComplete,
  assertHonestPublicLabel,
  assertModelCallAllowed,
  clearCapabilityKillSwitch,
  engageCapabilityKillSwitch,
  getPrompt,
  isProposalApproved,
  listAiCapabilities,
  listDeterministicCapabilities,
  listModelBackedCapabilities,
  redactSensitiveText,
  requireAiCapability,
  resolveModelForCapability,
  separateConflictingAccounts,
} from "@/lib/ai-platform";

describe("AI platform capability registry", () => {
  it("registers required baseline capabilities", () => {
    const keys = listAiCapabilities().map((c) => c.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "search.nl_interpreter",
        "search.access_needs_interpreter",
        "provider_finder.reply_generator",
        "agent.disability_services",
        "agent.booking_services",
        "case.deterministic_engine",
        "case.extractive_summary",
        "billing.copilot",
        "matching.care_rules",
        "matching.ai_overlay",
        "accesscast.forecast",
        "access_intelligence_next.preflight",
      ])
    );
  });

  it("marks case and billing copilots as deterministic", () => {
    const det = listDeterministicCapabilities().map((c) => c.key);
    expect(det).toEqual(
      expect.arrayContaining([
        "case.deterministic_engine",
        "billing.copilot",
        "matching.care_rules",
        "matching.ai_overlay",
      ])
    );
  });

  it("lists hybrid/model-backed search and agents separately", () => {
    const modelish = listModelBackedCapabilities().map((c) => c.key);
    expect(modelish).toEqual(
      expect.arrayContaining([
        "search.nl_interpreter",
        "agent.disability_services",
      ])
    );
  });

  it("rejects dishonest public labels for deterministic capabilities", () => {
    const cap = {
      ...requireAiCapability("billing.copilot"),
      productionClaimStatus: "public_allowed" as const,
    };
    expect(assertHonestPublicLabel(cap).ok).toBe(false);
  });
});

describe("kill switches and gateway", () => {
  beforeEach(() => {
    clearCapabilityKillSwitch("agent.disability_services");
    delete process.env.MAPABLE_AI_GLOBAL_KILL_SWITCH;
    delete process.env.MAPABLE_AI_PLATFORM_ENABLED;
    delete process.env.MAPABLE_AI_MODEL_GENERATION_ENABLED;
  });

  it("blocks model calls when capability kill switch engaged", () => {
    engageCapabilityKillSwitch("agent.disability_services");
    const result = assertModelCallAllowed({
      capabilityKey: "agent.disability_services",
    });
    expect(result.allowed).toBe(false);
  });

  it("returns deterministic fallback for deterministic capabilities", () => {
    const resolved = resolveModelForCapability({
      capabilityKey: "billing.copilot",
    });
    expect(resolved.ok).toBe(false);
    if (!resolved.ok) {
      expect(resolved.useDeterministicFallback).toBe(true);
    }
  });
});

describe("prompts and human review", () => {
  it("loads approved search interpreter prompt", () => {
    const prompt = getPrompt("search.nl_interpreter");
    expect(prompt?.approvalStatus).toBe("approved");
  });

  it("does not treat suggestion_generated as approved", () => {
    expect(isProposalApproved("suggestion_generated")).toBe(false);
    expect(isProposalApproved("approved")).toBe(true);
  });

  it("requires complete approval bindings", () => {
    expect(
      assertApprovalBindingComplete({
        proposalHash: "abc",
        actorId: "u1",
        actorAuthority: "coordinator",
        purpose: "accept_match",
        timestamp: new Date().toISOString(),
        expiresAt: null,
        dataDisclosed: ["candidate_id"],
        proposedAction: "accept",
        revision: 1,
      })
    ).toBe(true);
  });
});

describe("evidence envelopes and redaction", () => {
  it("detects conflicting account provenance", () => {
    const { hasConflict } = separateConflictingAccounts([
      {
        text: "Participant says the lift worked.",
        provenance: "participant_report",
        citations: [],
      },
      {
        text: "Provider says the lift was out.",
        provenance: "provider_report",
        citations: [],
      },
    ]);
    expect(hasConflict).toBe(true);
  });

  it("redacts secret-like tokens", () => {
    expect(redactSensitiveText("key sk-abcdefghijklmnopqrstuvwxyz1234")).toContain(
      "[REDACTED]"
    );
  });
});
