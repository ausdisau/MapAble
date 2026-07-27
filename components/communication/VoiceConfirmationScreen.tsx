"use client";

import type { VoiceConfirmationPayload } from "@/lib/intelligence/voice/voice-intent-service";

export function VoiceConfirmationScreen({
  confirmation,
  onConfirm,
  onCancel,
}: {
  confirmation: VoiceConfirmationPayload;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <section
      aria-labelledby="voice-confirm-heading"
      className="space-y-4 rounded-xl border p-4"
      role="dialog"
      aria-modal="true"
    >
      <h2 id="voice-confirm-heading" className="font-heading text-lg font-semibold">
        Confirm voice action
      </h2>
      <p>{confirmation.summary}</p>
      <p className="text-sm text-muted-foreground">
        Heard: &ldquo;{confirmation.intent.rawTranscript}&rdquo;
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-primary px-4 text-primary-foreground"
          onClick={onConfirm}
        >
          {confirmation.confirmLabel}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-4"
          onClick={onCancel}
        >
          {confirmation.cancelLabel}
        </button>
      </div>
    </section>
  );
}
