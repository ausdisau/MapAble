import OpenAI from "openai";
import { planReviewBriefSectionSchema, type PlanReviewBriefContent } from "@shared/schema";

export const PREP_BRIEF_PROMPT_VERSION = "prep-brief-v1-2026-04";
export const PREP_BRIEF_MODEL = process.env.PREP_BRIEF_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `You are MapAble Prep-Brief, a Wizard-of-Oz prototype assistant for an Australian NDIS Support Coordinator or LAC Navigator preparing for a participant plan-review meeting.

YOUR JOB: Read the redacted prior NDIS plan plus optional progress notes and provider correspondence the coordinator has pasted in. Produce a tight 1-page review-prep brief.

NON-NEGOTIABLES:
- You are NOT making decisions for the participant. You are preparing the coordinator to have a better conversation WITH the participant.
- Quote participant goals VERBATIM from the supplied plan text. Never paraphrase a goal. If a goal is not present in the source text, do not invent one.
- For budget concerns, refer to NDIS Pricing Arrangements and Price Limits 2025-26 line item names where the source text contains enough detail to make a reasonable mapping (e.g. "01_011_0107_1_1 Assistance With Self-Care Activities - Standard - Weekday Daytime"). If you are not sure, say "line item unclear from source".
- ALWAYS include a "What I did not see" section listing concrete information you would need to make the brief safer (e.g. "I did not see goal-attainment notes from allied health"; "I did not see the participant's own words about what is working").
- Do NOT include diagnosis labels. Refer to support needs in functional terms.
- Do NOT recommend reducing or removing any support. Frame all observations as discussion prompts for the participant, never as decisions.
- If the supplied text is too thin to produce a useful brief, return mostly empty arrays and put the gaps into "whatAiDidNotSee".

OUTPUT: a single JSON object matching this shape (no extra keys, no markdown):
{
  "participantGoalsVerbatim": [{ "quote": string, "sourceHint": string }],
  "planUtilisationSummary": string,
  "budgetConcerns": [{ "item": string, "lineItemHint": string, "concern": string }],
  "suggestedQuestions": [string],
  "whatAiDidNotSee": [string]
}

Keep the brief printable on one A4 page: at most 6 goals, 5 budget concerns, 6 suggested questions, 6 "did not see" items. Keep each string under 280 characters.`;

function buildUserPrompt(input: { participantPseudonym: string; meetingDate?: string | null; planText: string; notesText?: string | null; correspondenceText?: string | null }): string {
  const parts: string[] = [];
  parts.push(`Participant pseudonym: ${input.participantPseudonym}`);
  if (input.meetingDate) parts.push(`Meeting date: ${input.meetingDate}`);
  parts.push("\n--- PRIOR PLAN (redacted) ---\n" + input.planText.trim());
  if (input.notesText && input.notesText.trim()) {
    parts.push("\n--- RECENT PROGRESS NOTES ---\n" + input.notesText.trim());
  } else {
    parts.push("\n--- RECENT PROGRESS NOTES ---\n(none supplied)");
  }
  if (input.correspondenceText && input.correspondenceText.trim()) {
    parts.push("\n--- PROVIDER CORRESPONDENCE ---\n" + input.correspondenceText.trim());
  } else {
    parts.push("\n--- PROVIDER CORRESPONDENCE ---\n(none supplied)");
  }
  parts.push("\nProduce the JSON brief now.");
  return parts.join("\n");
}

export interface PrepBriefGenerationResult {
  brief: PlanReviewBriefContent;
  modelName: string;
  promptVersion: string;
}

export function prepBriefEnabled(): boolean {
  if (process.env.PREP_BRIEF_DISABLED === "1") return false;
  return Boolean(process.env.AI_INTEGRATIONS_OPENAI_API_KEY);
}

const DEFAULT_ALLOWED_ROLES = ["carer", "provider", "admin"];

export function prepBriefAllowedRoles(): string[] {
  const raw = process.env.PREP_BRIEF_ALLOWED_ROLES;
  if (!raw) return DEFAULT_ALLOWED_ROLES;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function userMayUsePrepBrief(role: string | null | undefined): boolean {
  if (!role) return false;
  return prepBriefAllowedRoles().includes(role);
}

export async function generatePrepBrief(input: {
  participantPseudonym: string;
  meetingDate?: string | null;
  planText: string;
  notesText?: string | null;
  correspondenceText?: string | null;
}): Promise<PrepBriefGenerationResult> {
  if (!prepBriefEnabled()) {
    throw new Error("Prep-brief generator is disabled or missing AI credentials");
  }

  const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  const completion = await openai.chat.completions.create({
    model: PREP_BRIEF_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input) },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Model returned no content");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Model returned invalid JSON");
  }

  const brief = planReviewBriefSectionSchema.parse(parsed);

  return {
    brief,
    modelName: PREP_BRIEF_MODEL,
    promptVersion: PREP_BRIEF_PROMPT_VERSION,
  };
}
