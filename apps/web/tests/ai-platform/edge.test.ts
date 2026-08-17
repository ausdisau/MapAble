import { afterEach, describe, expect, it } from "vitest";

import {
  explainWhatChangedLocally,
  requireAiCapability,
  routeModelBackedEdgeCapability,
  selectProcessingMode,
  summarizeVisitPackOffline,
} from "@/lib/ai/platform";
import type { DeviceCapabilitySnapshot } from "@/lib/ai/platform";

const baseDevice: DeviceCapabilitySnapshot = {
  hasOnDeviceModelRuntime: false,
  osSupportsOnDeviceAi: false,
  modelAvailable: false,
  networkAvailable: true,
  batteryPercent: 80,
  preferLocalProcessing: true,
  dataSensitivity: "participant_pii",
  consentAllowsCloud: false,
  accessibilityPreferDeterministic: false,
};

describe("Edge AI Capability Broker", () => {
  afterEach(() => {
    delete process.env.MAPABLE_EDGE_AI_ENABLED;
    delete process.env.MAPABLE_ON_DEVICE_AI_ENABLED;
    delete process.env.MAPABLE_CLOUD_AI_FALLBACK_ENABLED;
  });

  it("registers edge capabilities without App Store claim path", () => {
    const pack = requireAiCapability("edge.visit_pack_summary");
    const changed = requireAiCapability("edge.what_changed_explain");
    expect(pack.productionClaimStatus).toBe("not_claimable");
    expect(changed.authorityCeiling).toBe("READ_ONLY_EXPLAIN");
  });

  it("prefers deterministic local for non-model work", () => {
    process.env.MAPABLE_EDGE_AI_ENABLED = "true";
    expect(
      selectProcessingMode({
        device: baseDevice,
        allowOnDevice: true,
        allowCloud: true,
        requiresModel: false,
      })
    ).toBe("deterministic_local");
  });

  it("summarises Visit Pack offline with receipt and no data leaving device", () => {
    process.env.MAPABLE_EDGE_AI_ENABLED = "true";
    const result = summarizeVisitPackOffline({
      pack: {
        packId: "vp-1",
        passportVersion: 3,
        expiresAt: "2099-01-01T00:00:00.000Z",
        instructions: [
          {
            id: "i1",
            mode: "plain_language",
            workerFacingWording: "Ask one question at a time",
            required: true,
          },
        ],
      },
      device: baseDevice,
      receiptId: "rcpt-1",
      consentBasis: "worker_shift_disclosure",
    });
    expect(result.value?.summary).toContain("Visit Pack vp-1");
    expect(result.receipt.dataLeftDevice).toBe(false);
    expect(result.receipt.publicAppStoreClaim).toBe(false);
    expect(result.equivalentNonAiPathAvailable).toBe(true);
    expect(result.receipt.processingMode).toBe("deterministic_local");
  });

  it("explains What Changed locally", () => {
    process.env.MAPABLE_EDGE_AI_ENABLED = "true";
    const result = explainWhatChangedLocally({
      changes: [
        {
          dependencyId: "care",
          label: "Care shift",
          fromState: "not_started",
          toState: "confirmed",
          responsibleParty: "coordinator",
        },
      ],
      device: baseDevice,
      receiptId: "rcpt-2",
      consentBasis: "participant_mission_view",
    });
    expect(result.value?.changeCount).toBe(1);
    expect(result.value?.explanation).toContain("Care shift");
    expect(result.receipt.capability).toBe("edge.what_changed_explain");
  });

  it("routes model-backed edge work to human when cloud/on-device off", () => {
    process.env.MAPABLE_EDGE_AI_ENABLED = "true";
    const result = routeModelBackedEdgeCapability({
      capability: "edge.plain_language_rewrite",
      device: baseDevice,
      receiptId: "rcpt-3",
      consentBasis: "participant_preference",
    });
    expect(result.value).toBeNull();
    expect(result.receipt.processingMode).toBe("human_assistance");
    expect(result.receipt.humanReviewRequired).toBe(true);
    expect(result.equivalentNonAiPathAvailable).toBe(true);
  });

  it("returns disabled receipt when edge flag is off", () => {
    const result = summarizeVisitPackOffline({
      pack: {
        packId: "vp-2",
        passportVersion: 1,
        expiresAt: "2099-01-01T00:00:00.000Z",
        instructions: [],
      },
      device: baseDevice,
      receiptId: "rcpt-4",
      consentBasis: "worker_shift_disclosure",
    });
    expect(result.value).toBeNull();
    expect(result.receipt.outputStatus).toBe("disabled");
  });
});
