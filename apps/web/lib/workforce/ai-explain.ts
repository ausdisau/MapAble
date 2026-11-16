import { generateText, gateway } from "ai";

import type { SkillsGapItem } from "@/lib/workforce/skills-gap";

export type SkillsGapExplanation = {
  labelledAi: boolean;
  source: "structured" | "ai";
  text: string;
};

const AI_DISCLAIMER =
  "AI explanation. It cannot issue clearance, certify competence, or authorise a task.";

export function structuredSkillsGapExplanation(gaps: SkillsGapItem[]): SkillsGapExplanation {
  const lines = gaps.map((gap) => `${gap.label}: ${gap.copy} Next: ${gap.nextAction}`);
  return {
    labelledAi: false,
    source: "structured",
    text: lines.join("\n") || "No skill gaps to explain.",
  };
}

/**
 * Optional summary of **already computed** gaps. Cannot write screening or
 * competency records. Non-AI copy is always available.
 */
export async function explainSkillsGaps(input: {
  gaps: SkillsGapItem[];
  aiRequested: boolean;
}): Promise<SkillsGapExplanation> {
  const structured = structuredSkillsGapExplanation(input.gaps);
  if (!input.aiRequested) return structured;

  try {
    const result = await generateText({
      model: gateway("openai/gpt-oss-20b"),
      maxOutputTokens: 400,
      prompt: [
        "Summarise these already-computed workforce skill gaps in plain language.",
        "Do not invent credentials, screening outcomes, or competence.",
        "Do not authorise any task.",
        "Say that training is not competence and mock claims are not clearance.",
        structured.text.slice(0, 2500),
      ].join("\n"),
    });
    const text = result.text?.trim();
    if (!text) return structured;
    return {
      labelledAi: true,
      source: "ai",
      text: `${AI_DISCLAIMER}\n\n${text}`,
    };
  } catch {
    return structured;
  }
}

/** AI explain has no Prisma writes and must never be given a database client. */
export const AI_EXPLAIN_WRITE_PERMISSION = false;
