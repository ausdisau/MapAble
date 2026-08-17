import type { AccessibilityProfile } from "@prisma/client";

import type {
  CommunicationMode,
  CommunicationPassport,
  CommunicationPassportInstruction,
} from "@/lib/support/communication-passport/types";

const MODE_COPY: Record<
  CommunicationMode,
  { participant: string; worker: string }
> = {
  plain_language: {
    participant: "Use plain language with me",
    worker: "Use plain language. Avoid jargon.",
  },
  one_question_at_a_time: {
    participant: "Ask me one question at a time",
    worker: "Ask one question at a time. Wait for a response before continuing.",
  },
  written_and_spoken: {
    participant: "Give me written and spoken instructions",
    worker: "Provide both written and spoken instructions.",
  },
  aac: {
    participant: "I use AAC — allow enough time and do not speak over my device",
    worker:
      "Participant uses AAC. Allow device time. Do not speak over the device. Do not assume silence means agreement.",
  },
  auslan: {
    participant: "I use Auslan",
    worker: "Use Auslan or book a qualified interpreter. Do not rely on lip-reading alone.",
  },
  support_person: {
    participant: "I may want a support person present",
    worker: "Offer a support person. Support person ≠ decision-making authority.",
  },
  written_only: {
    participant: "Prefer written communication only",
    worker: "Use written communication only unless the participant requests otherwise.",
  },
  sms: {
    participant: "Prefer SMS reminders",
    worker: "Prefer SMS for short reminders when consented.",
  },
  email: {
    participant: "Prefer email",
    worker: "Prefer email for detailed information when consented.",
  },
  phone: {
    participant: "Phone calls are OK",
    worker: "Phone contact is acceptable when consented.",
  },
  extra_response_time: {
    participant: "I need more time to respond",
    worker: "Allow extended response time. Do not rush or fill silence.",
  },
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

/**
 * Project Communication Passport from AccessibilityProfile — no parallel profile SoT.
 */
export function communicationPassportFromProfile(
  profile: Pick<
    AccessibilityProfile,
    "userId" | "communicationPreferences" | "cognitivePreferences" | "updatedAt"
  >,
): CommunicationPassport {
  const prefs = asStringArray(profile.communicationPreferences);
  const cognitive = asRecord(profile.cognitivePreferences);
  const modes = new Set<CommunicationMode>();

  for (const p of prefs) {
    if (p in MODE_COPY) modes.add(p as CommunicationMode);
  }
  if (cognitive.oneQuestionAtATime === true) modes.add("one_question_at_a_time");
  if (cognitive.extraResponseTime === true) modes.add("extra_response_time");
  if (cognitive.writtenAndSpoken === true) modes.add("written_and_spoken");
  if (prefs.includes("aac") || cognitive.usesAac === true) modes.add("aac");

  const instructions: CommunicationPassportInstruction[] = [
    ...modes,
  ].map((mode, index) => ({
    id: `instr_${mode}`,
    mode,
    participantWording: MODE_COPY[mode].participant,
    workerFacingWording: MODE_COPY[mode].worker,
    required: mode === "aac" || mode === "one_question_at_a_time",
    sortOrder: index,
  }));

  const version =
    typeof cognitive.communicationPassportVersion === "number"
      ? cognitive.communicationPassportVersion
      : 1;

  return {
    participantId: profile.userId,
    version,
    updatedAt: profile.updatedAt.toISOString(),
    instructions,
    disclosableFieldKeys: [
      "instructions.mode",
      "instructions.workerFacingWording",
      "instructions.required",
    ],
  };
}

export function workerFacingPassportSubset(
  passport: CommunicationPassport,
): Pick<CommunicationPassport, "participantId" | "version" | "instructions"> {
  return {
    participantId: passport.participantId,
    version: passport.version,
    instructions: passport.instructions.map((i) => ({
      id: i.id,
      mode: i.mode,
      participantWording: i.participantWording,
      workerFacingWording: i.workerFacingWording,
      required: i.required,
      sortOrder: i.sortOrder,
    })),
  };
}
