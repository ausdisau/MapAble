import { z } from "zod";

import {
  ICAN_V6_DOMAIN_IDS,
  ICanV6IntakeSchema,
  iCanV6DomainIdSchema,
  iCanV6FrequencySchema,
  iCanV6SupportNeedLevelSchema,
  type ICanV6DomainId,
  type ICanV6Frequency,
  type ICanV6Intake,
  type ICanV6SupportNeedLevel,
} from "@/lib/validation/i-can-v6";

/** Life areas shown in the registration assessor (subset of I-CAN domains). */
export const SUPPORT_NEEDS_LIFE_AREA_IDS = [
  "mobility",
  "self_care",
  "domestic_life",
  "communication",
  "looking_after_ones_health",
  "community_social_civic_life",
] as const;

export type SupportNeedsLifeAreaId =
  (typeof SUPPORT_NEEDS_LIFE_AREA_IDS)[number];

export const SUPPORT_NEEDS_LIFE_AREAS: readonly {
  id: SupportNeedsLifeAreaId;
  label: string;
  description: string;
}[] = [
  {
    id: "mobility",
    label: "Getting around",
    description: "Moving at home and in the community, transfers, mobility aids.",
  },
  {
    id: "self_care",
    label: "Personal care",
    description: "Washing, dressing, eating, drinking, and toileting.",
  },
  {
    id: "domestic_life",
    label: "Home & daily tasks",
    description: "Meals, cleaning, shopping, and looking after your home.",
  },
  {
    id: "communication",
    label: "Talking & understanding",
    description: "Speech, Auslan, AAC, reading, and being understood.",
  },
  {
    id: "looking_after_ones_health",
    label: "Health & wellbeing",
    description: "Medications, appointments, and looking after your health.",
  },
  {
    id: "community_social_civic_life",
    label: "Community & connections",
    description: "Getting out, social activities, and community life.",
  },
];

/** Plain-language intensity → I-CAN support need level. */
export const SUPPORT_NEEDS_INTENSITY_OPTIONS = [
  {
    value: "a_little",
    label: "A little help",
    description: "Occasional check-ins or reminders are enough.",
    supportNeedLevel: "intermittent" as const,
    frequency: "occasionally" as const,
  },
  {
    value: "some",
    label: "Some support",
    description: "Regular help with parts of this area.",
    supportNeedLevel: "limited" as const,
    frequency: "regularly" as const,
  },
  {
    value: "a_lot",
    label: "A lot of support",
    description: "Help with most of this area, most days.",
    supportNeedLevel: "extensive" as const,
    frequency: "daily" as const,
  },
  {
    value: "all_the_time",
    label: "Support all the time",
    description: "Someone needs to be with me for this area.",
    supportNeedLevel: "pervasive" as const,
    frequency: "constantly" as const,
  },
] as const;

export type SupportNeedsIntensity =
  (typeof SUPPORT_NEEDS_INTENSITY_OPTIONS)[number]["value"];

const supportNeedsIntensitySchema = z.enum([
  "a_little",
  "some",
  "a_lot",
  "all_the_time",
]);

const lifeAreaIdSchema = z.enum(SUPPORT_NEEDS_LIFE_AREA_IDS);

function sanitizeNotes(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

const areaAnswerSchema = z.object({
  domainId: lifeAreaIdSchema,
  intensity: supportNeedsIntensitySchema,
  /** Optional override; defaults from intensity mapping. */
  supportNeedLevel: iCanV6SupportNeedLevelSchema.optional(),
  frequency: iCanV6FrequencySchema.optional(),
});

/**
 * Lite registration assessor body.
 * Either submit answers or skip for later.
 */
export const SupportNeedsAssessorSubmitSchema = z
  .object({
    skipped: z.literal(false).optional(),
    selectedAreas: z.array(lifeAreaIdSchema).min(1).max(6),
    answers: z.array(areaAnswerSchema).min(1).max(6),
    priorityArea: lifeAreaIdSchema.optional(),
    anythingElse: z
      .string()
      .max(2000)
      .optional()
      .transform((v) => (v === undefined ? undefined : sanitizeNotes(v)))
      .pipe(z.string().max(2000).optional()),
    consentDraftProcessing: z.literal(true),
    consentNoClinicalPaste: z.literal(true),
    clientSessionId: z.string().min(1).max(100).optional(),
  })
  .superRefine((data, ctx) => {
    const selected = new Set(data.selectedAreas);
    const answered = new Set(data.answers.map((a) => a.domainId));

    for (const id of selected) {
      if (!answered.has(id)) {
        ctx.addIssue({
          code: "custom",
          path: ["answers"],
          message: `Missing intensity answer for ${id}`,
        });
      }
    }

    for (const id of answered) {
      if (!selected.has(id)) {
        ctx.addIssue({
          code: "custom",
          path: ["answers"],
          message: `Answer for unselected area ${id}`,
        });
      }
    }

    if (data.priorityArea && !selected.has(data.priorityArea)) {
      ctx.addIssue({
        code: "custom",
        path: ["priorityArea"],
        message: "Priority area must be one of the selected life areas",
      });
    }
  });

export const SupportNeedsAssessorSkipSchema = z.object({
  skipped: z.literal(true),
});

export const SupportNeedsAssessorBodySchema = z.union([
  SupportNeedsAssessorSkipSchema,
  SupportNeedsAssessorSubmitSchema,
]);

export type SupportNeedsAssessorSubmit = z.infer<
  typeof SupportNeedsAssessorSubmitSchema
>;
export type SupportNeedsAssessorBody = z.infer<
  typeof SupportNeedsAssessorBodySchema
>;

export const REGISTRATION_ASSESSOR_STATUS = "registration_lite" as const;
export const REGISTRATION_ASSESSOR_SKIPPED_STATUS =
  "registration_skipped" as const;

function intensityDefaults(intensity: SupportNeedsIntensity): {
  supportNeedLevel: ICanV6SupportNeedLevel;
  frequency: ICanV6Frequency;
} {
  const match = SUPPORT_NEEDS_INTENSITY_OPTIONS.find(
    (o) => o.value === intensity,
  );
  if (!match) {
    return { supportNeedLevel: "limited", frequency: "regularly" };
  }
  return {
    supportNeedLevel: match.supportNeedLevel,
    frequency: match.frequency,
  };
}

/**
 * Map lite assessor answers into a full I-CAN v6 intake payload.
 * Unselected domains default to none / never / completed.
 */
export function mapLiteAssessorToICanPayload(
  input: SupportNeedsAssessorSubmit,
): ICanV6Intake {
  const answerByDomain = new Map(
    input.answers.map((a) => [a.domainId, a] as const),
  );

  const domains = {} as ICanV6Intake["domains"];
  const generalNotesParts: string[] = [];

  if (input.priorityArea) {
    generalNotesParts.push(`Priority area: ${input.priorityArea}`);
  }
  if (input.anythingElse?.trim()) {
    generalNotesParts.push(input.anythingElse.trim());
  }
  const sharedNotes = generalNotesParts.join("\n\n");

  for (const id of ICAN_V6_DOMAIN_IDS) {
    const answer = answerByDomain.get(id as SupportNeedsLifeAreaId);
    if (!answer) {
      domains[id] = {
        supportNeedLevel: "none",
        frequency: "never",
        notes: "",
        completed: true,
      };
      continue;
    }

    const defaults = intensityDefaults(answer.intensity);
    const isPriority = input.priorityArea === id;
    const notesParts = [
      `Registration assessor intensity: ${answer.intensity}`,
      isPriority ? "Marked as what matters most." : null,
      id === "looking_after_ones_health" ||
      (sharedNotes && id === (input.priorityArea ?? input.selectedAreas[0]))
        ? sharedNotes || null
        : null,
    ].filter(Boolean);

    domains[id] = {
      supportNeedLevel: answer.supportNeedLevel ?? defaults.supportNeedLevel,
      frequency: answer.frequency ?? defaults.frequency,
      notes: notesParts.join(" "),
      completed: true,
    };
  }

  // Ensure free-text lands somewhere even if no priority was chosen.
  if (sharedNotes) {
    const target =
      (input.priorityArea as ICanV6DomainId | undefined) ??
      (input.selectedAreas[0] as ICanV6DomainId);
    if (target && !domains[target].notes.includes(sharedNotes)) {
      domains[target] = {
        ...domains[target],
        notes: [domains[target].notes, sharedNotes].filter(Boolean).join("\n\n"),
      };
    }
  }

  const payload = {
    domains,
    consentDraftProcessing: true as const,
    consentNoClinicalPaste: true as const,
    clientSessionId:
      input.clientSessionId ??
      `registration_assessor_${Date.now().toString(36)}`,
  };

  return ICanV6IntakeSchema.parse(payload);
}

/** Type-narrow helper for life-area ids used in the UI. */
export function isSupportNeedsLifeAreaId(
  value: string,
): value is SupportNeedsLifeAreaId {
  return (SUPPORT_NEEDS_LIFE_AREA_IDS as readonly string[]).includes(value);
}

// Re-export for callers that need full domain validation.
export { iCanV6DomainIdSchema };
