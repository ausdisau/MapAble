/**
 * Policy evidence register for MapAble AI research.
 * Descriptive metadata; URLs are references, not ingestion approval or licence.
 * Current web verification: 2026-11-10.
 */
import { z } from "zod";

export const policySourceSchema = z.strictObject({
  id: z.string().min(3),
  title: z.string().min(5),
  url: z.string().url(),
  jurisdiction: z.enum(["AU", "US", "comparative"]),
  evidenceTier: z.enum(["government_primary", "secondary_research"]),
  instrumentType: z.enum([
    "executive_order", "government_plan", "government_review", "research_index"
  ]),
  publishedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  consultedOn: z.literal("2026-11-10"),
  bindingScope: z.string().min(10),
  status: z.enum(["published", "recommendations_not_law", "secondary_analysis"]),
  licensing: z.literal("unverified_no_training"),
  limitation: z.string().min(10)
});

export type PolicySource = z.infer<typeof policySourceSchema>;

export const AI_POLICY_SOURCES: readonly PolicySource[] = [
  {
    id: "us-eo-14434-2026",
    title: "US Executive Order 14434: Inaugurating the Era of Super Intelligence",
    url: "https://www.whitehouse.gov/presidential-actions/2026/09/inaugurating-the-era-of-super-intelligence/",
    jurisdiction: "US", evidenceTier: "government_primary",
    instrumentType: "executive_order", publishedOn: "2026-09-29",
    consultedOn: "2026-11-10",
    bindingScope: "US executive-branch terminology within applicable law; not Australian law or a demonstrated AI capability",
    status: "published", licensing: "unverified_no_training",
    limitation: "Section 3 initially adopts the pre-existing 15 USC 9401(3) AI definition for the order and requests a legislative proposal. Do not label an untested model superhuman."
  },
  {
    id: "au-national-ai-plan-2025",
    title: "Australian Government National AI Plan",
    url: "https://www.industry.gov.au/publications/national-ai-plan",
    jurisdiction: "AU", evidenceTier: "government_primary",
    instrumentType: "government_plan", publishedOn: "2025-12-02",
    consultedOn: "2026-11-10",
    bindingScope: "Australian Government policy: capture opportunity, spread benefits, keep Australians safe",
    status: "published", licensing: "unverified_no_training",
    limitation: "Strategic goals are not themselves participant funding rights, mandatory standards or enacted laws."
  },
  {
    id: "au-pmc-ai-cyber-review-2026",
    title: "PM&C: Rapid Review of Australian Government Arrangements for an AI-driven Cyber Incident — Recommendations",
    url: "https://www.pmc.gov.au/resources/rapid-review-australian-government-arrangements-ai-driven-cyber-incident/rapid-review-australian-government-arrangements-ai-driven-cyber-incident-recommendations",
    jurisdiction: "AU", evidenceTier: "government_primary",
    instrumentType: "government_review", publishedOn: "2026-10-01",
    consultedOn: "2026-11-10",
    bindingScope: "Recommendations for Australian Government consideration; not standalone enforceable obligations",
    status: "recommendations_not_law", licensing: "unverified_no_training",
    limitation: "Review includes 18 recommendations. Verify any subsequent government response or legislation independently."
  },
  {
    id: "ginc-national-ai-strategies",
    title: "Global Institute for National Capability: National AI Strategies",
    url: "https://www.ginc.org/tag/national-ai-strategies/",
    jurisdiction: "comparative", evidenceTier: "secondary_research",
    instrumentType: "research_index", publishedOn: "2026-01-09",
    consultedOn: "2026-11-10",
    bindingScope: "Independent comparative research index, not a government legal or policy authority",
    status: "secondary_analysis", licensing: "unverified_no_training",
    limitation: "Tag archive features articles of different publication dates; each country strategy must be linked to its government-issued primary document."
  },
  {
    id: "ginc-80-strategies-2026",
    title: "Global Institute for National Capability: 80 National AI Strategies / 2026 Update",
    url: "https://www.ginc.org/80-national-ai-strategies-2026-update/",
    jurisdiction: "comparative", evidenceTier: "secondary_research",
    instrumentType: "research_index", publishedOn: "2026-10-07",
    consultedOn: "2026-11-10",
    bindingScope: "GINC methodology and synthesis of national AI strategies; independently reviewed commentary",
    status: "secondary_analysis", licensing: "unverified_no_training",
    limitation: "GINC reports an 80-country index with scope and selection rules. Scores/archetypes are GINC's analysis, not official legal findings."
  }
] as const;

export function getAiPolicySource(id: string): PolicySource | undefined {
  return AI_POLICY_SOURCES.find((source) => source.id === id);
}

/** Secondary sources may lead to research questions, never primary legal proof. */
export function maySupportPrimaryLegalClaim(source: PolicySource): boolean {
  return source.evidenceTier === "government_primary" &&
    source.instrumentType === "executive_order" &&
    source.status === "published";
}

export function validatePolicySourceRegister(): void {
  const ids = new Set<string>();
  for (const item of AI_POLICY_SOURCES) {
    policySourceSchema.parse(item);
    if (ids.has(item.id)) throw new Error("DUPLICATE_POLICY_SOURCE");
    ids.add(item.id);
  }
}
