"use client";

import { VoiceConfirmationScreen } from "@/components/communication/VoiceConfirmationScreen";
import type { VoiceConfirmationPayload } from "@/lib/intelligence/voice/voice-intent-service";

const DEMO_CONFIRMATION: VoiceConfirmationPayload = {
  intent: {
    type: "prepare_message",
    consequence: "consequential",
    parameters: { draft: "Example draft" },
    rawTranscript: "prepare a message to my coordinator",
    confidence: 0.9,
    parsedAt: new Date().toISOString(),
  },
  summary: "Prepare a message draft for your review before sending.",
  confirmLabel: "Confirm action",
  cancelLabel: "Cancel",
};

export function VoiceCommandsDemo() {
  return (
    <VoiceConfirmationScreen
      confirmation={DEMO_CONFIRMATION}
      onConfirm={() => undefined}
      onCancel={() => undefined}
    />
  );
}
