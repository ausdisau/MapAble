import { mobileCommunicationConfig } from "@/lib/config/mobile-communication";

export type VoiceIntentType =
  | "open_mission"
  | "check_bookings"
  | "report_cancellation"
  | "prepare_message"
  | "review_options";

export type VoiceIntentConsequence = "read_only" | "consequential";

export interface VoiceIntent {
  type: VoiceIntentType;
  consequence: VoiceIntentConsequence;
  parameters: Record<string, string>;
  rawTranscript: string;
  confidence: number;
  parsedAt: string;
}

export interface VoiceConfirmationPayload {
  intent: VoiceIntent;
  summary: string;
  confirmLabel: string;
  cancelLabel: string;
}

const INTENT_PATTERNS: Array<{
  type: VoiceIntentType;
  consequence: VoiceIntentConsequence;
  patterns: RegExp[];
}> = [
  {
    type: "open_mission",
    consequence: "read_only",
    patterns: [/open (?:my )?mission/i, /show (?:my )?mission/i],
  },
  {
    type: "check_bookings",
    consequence: "read_only",
    patterns: [/check (?:my )?bookings?/i, /what(?:'s| is) (?:my )?(?:next )?booking/i],
  },
  {
    type: "report_cancellation",
    consequence: "consequential",
    patterns: [/report (?:a )?cancellation/i, /cancel (?:my )?(?:booking|trip)/i],
  },
  {
    type: "prepare_message",
    consequence: "consequential",
    patterns: [/prepare (?:a )?message/i, /draft (?:a )?message/i, /send (?:a )?message/i],
  },
  {
    type: "review_options",
    consequence: "read_only",
    patterns: [/review options/i, /what are my options/i, /show options/i],
  },
];

export function parseVoiceIntent(transcript: string): VoiceIntent | null {
  const trimmed = transcript.trim();
  if (!trimmed) return null;

  for (const entry of INTENT_PATTERNS) {
    for (const pattern of entry.patterns) {
      if (pattern.test(trimmed)) {
        return {
          type: entry.type,
          consequence: entry.consequence,
          parameters: extractParameters(entry.type, trimmed),
          rawTranscript: trimmed,
          confidence: 0.85,
          parsedAt: new Date().toISOString(),
        };
      }
    }
  }

  return null;
}

function extractParameters(
  type: VoiceIntentType,
  transcript: string,
): Record<string, string> {
  switch (type) {
    case "open_mission": {
      const match = transcript.match(/mission(?: id)?[:\s]+(\S+)/i);
      return match ? { missionId: match[1] } : {};
    }
    case "check_bookings":
      return {};
    case "report_cancellation": {
      const match = transcript.match(/(?:booking|trip)[:\s]+(\S+)/i);
      return match ? { bookingId: match[1] } : {};
    }
    case "prepare_message": {
      const match = transcript.match(/message[:\s]+(.+)/i);
      return match ? { draft: match[1].trim() } : {};
    }
    case "review_options":
      return {};
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

export function requiresVoiceConfirmation(intent: VoiceIntent): boolean {
  if (intent.consequence === "read_only") return false;
  if (mobileCommunicationConfig.voiceBypassConfirmationEnabled) return false;
  return true;
}

export function buildVoiceConfirmation(intent: VoiceIntent): VoiceConfirmationPayload {
  const summaries: Record<VoiceIntentType, string> = {
    open_mission: "Open your CareOS mission dashboard.",
    check_bookings: "Show your upcoming bookings.",
    report_cancellation: "Report a cancellation — this will notify your provider.",
    prepare_message: "Prepare a message draft for your review before sending.",
    review_options: "Review available options for your current context.",
  };

  return {
    intent,
    summary: summaries[intent.type],
    confirmLabel: "Confirm action",
    cancelLabel: "Cancel",
  };
}

export function assertVoiceConfirmationProvided(
  intent: VoiceIntent,
  confirmed: boolean,
): void {
  if (!requiresVoiceConfirmation(intent)) return;
  if (!confirmed) {
    throw new Error("VOICE_CONFIRMATION_REQUIRED");
  }
}
