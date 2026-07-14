import { describe, expect, it } from "vitest";

import { assertSpeechDifficultyNotCapacityReduction } from "@/lib/communication/communication-passport-service";

describe("communication passport capacity boundaries", () => {
  it("allows participant-authored capacity notes without inference language", () => {
    expect(() =>
      assertSpeechDifficultyNotCapacityReduction(
        "I use AAC and need extra time to respond.",
      ),
    ).not.toThrow();
  });

  it("rejects inferred reduced capacity language", () => {
    expect(() =>
      assertSpeechDifficultyNotCapacityReduction("Participant has reduced capacity"),
    ).toThrow("PROHIBITED_CAPACITY_INFERENCE_FROM_SPEECH");
  });

  it("rejects language linking speech difficulty to decision-making", () => {
    expect(() =>
      assertSpeechDifficultyNotCapacityReduction("Unable to consent due to speech"),
    ).toThrow("PROHIBITED_CAPACITY_INFERENCE_FROM_SPEECH");
  });
});
