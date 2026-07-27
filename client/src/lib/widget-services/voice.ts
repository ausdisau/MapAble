import { postJson, type ServiceContext, type ServiceResult } from "./types";

export interface VoiceTranscript {
  transcript: string;
  durationMs: number;
}

export function createVoiceService(ctx: ServiceContext) {
  return {
    async transcribe(audio: Blob): Promise<ServiceResult<VoiceTranscript>> {
      try {
        const form = new FormData();
        form.append("audio", audio, "voice-input.webm");
        const res = await fetch(`${ctx.endpoint}/transcribe`, {
          method: "POST",
          body: form,
          credentials: "include",
        });
        if (!res.ok) {
          const text = (await res.text().catch(() => "")) || res.statusText;
          return { ok: false, data: null, error: text, status: res.status };
        }
        const data = (await res.json()) as VoiceTranscript;
        return { ok: true, data, error: null, status: res.status };
      } catch (err) {
        return {
          ok: false,
          data: null,
          error: err instanceof Error ? err.message : "Voice service error",
          status: 0,
        };
      }
    },
    intake(payload: { transcript: string; sessionId?: string }): Promise<ServiceResult<{ accepted: boolean }>> {
      return postJson(`${ctx.endpoint}/intake`, payload);
    },
  };
}
