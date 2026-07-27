import { describe, expect, it } from "vitest";

import { mobileCommunicationConfig } from "@/lib/config/mobile-communication";

describe("mobile communication config", () => {
  it("defaults feature flags to disabled via env", () => {
    expect(typeof mobileCommunicationConfig.pwaOfflineEnabled).toBe("boolean");
    expect(typeof mobileCommunicationConfig.mobilePushEnabled).toBe("boolean");
    expect(typeof mobileCommunicationConfig.aacCommunicationEnabled).toBe("boolean");
    expect(typeof mobileCommunicationConfig.voiceCommandsEnabled).toBe("boolean");
  });

  it("hardcodes safety flags off", () => {
    expect(mobileCommunicationConfig.voiceBypassConfirmationEnabled).toBe(false);
    expect(mobileCommunicationConfig.speechDifficultyImpliesCapacityReduction).toBe(
      false,
    );
  });
});

describe("mobile communication config guards", () => {
  it("throws when AAC disabled", async () => {
    const { ensureAacCommunicationEnabled } = await import(
      "@/lib/config/mobile-communication"
    );
    if (mobileCommunicationConfig.aacCommunicationEnabled) {
      expect(() => ensureAacCommunicationEnabled()).not.toThrow();
    } else {
      expect(() => ensureAacCommunicationEnabled()).toThrow(
        "AAC_COMMUNICATION_DISABLED",
      );
    }
  });
});
