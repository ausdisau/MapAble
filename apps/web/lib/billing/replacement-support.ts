import { z } from "zod";

import type { ReplacementSupportCalculations } from "@/lib/billing/replacement-calculator";

/**
 * Official I-CAN v6 domain keys (snake_case).
 * Ticket example "self_management" maps to general_tasks_and_demands.
 */
export const ICAN_V6_DOMAINS = [
  "mobility",
  "domestic_life",
  "self_care",
  "community_social_civic_life",
  "communication",
  "learning_applying_knowledge",
  "general_tasks_and_demands",
  "life_long_learning",
  "interpersonal_interactions_relationships",
  "behaviours_of_concern",
  "mental_emotional_health",
  "physical_health",
] as const;

export type IcanV6Domain = (typeof ICAN_V6_DOMAINS)[number];

export const ICAN_V6_DOMAIN_LABELS: Record<IcanV6Domain, string> = {
  mobility: "Mobility",
  domestic_life: "Domestic Life",
  self_care: "Self Care",
  community_social_civic_life: "Community, Social & Civic Life",
  communication: "Communication",
  learning_applying_knowledge: "Learning & Applying Knowledge",
  general_tasks_and_demands: "General Tasks and Demands",
  life_long_learning: "Life Long Learning",
  interpersonal_interactions_relationships:
    "Interpersonal Interactions & Relationships",
  behaviours_of_concern: "Behaviours of Concern",
  mental_emotional_health: "Mental & Emotional Health",
  physical_health: "Physical Health",
};

/**
 * Default NDIS weekday daytime Assistance with Self-Care hourly cap (AUD).
 * Matches seed catalogue priceCapCents 6706. Replace with live catalogue lookup later.
 */
export const DEFAULT_NDIS_HOURLY_WORKER_RATE_AUD = 67.06;

const positiveFiniteAud = z.number().finite().positive();

export const ReplacementSupportRequestSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID is required"),
  icanDomainDeficit: z
    .array(z.enum(ICAN_V6_DOMAINS))
    .min(1, "Select at least one I-CAN v6 domain"),
  proposedDevice: z.object({
    name: z.string().trim().min(1, "Device name is required").max(200),
    model: z.string().trim().min(1, "Device model is required").max(200),
    unitCostAUD: positiveFiniteAud,
  }),
  replacedSupportHoursPerWeek: positiveFiniteAud,
  hourlyWorkerRateAUD: positiveFiniteAud.default(
    DEFAULT_NDIS_HOURLY_WORKER_RATE_AUD
  ),
  justificationNotes: z
    .string()
    .trim()
    .min(1, "Justification notes are required")
    .max(5000, "Justification notes are too long"),
});

export type ReplacementSupportRequest = z.infer<
  typeof ReplacementSupportRequestSchema
>;

export type ReplacementSupportEvidencePack = {
  authorityCeiling: "DRAFT_ONLY";
  actionTaken: false;
  requiresHumanConfirmation: true;
  editable: true;
  supportCategory: "replacement_supports";
  framework: "NDIS";
  summary: string;
  participantId: string;
  icanDomainDeficit: IcanV6Domain[];
  icanDomainLabels: string[];
  proposedDevice: ReplacementSupportRequest["proposedDevice"];
  replacedSupportHoursPerWeek: number;
  hourlyWorkerRateAUD: number;
  clinicalJustification: {
    notes: string;
    rationale: string;
  };
  costBenefit: ReplacementSupportCalculations;
  prohibited: readonly string[];
};

const PROHIBITED = [
  "automatic_ndia_submission",
  "automatic_plan_manager_approval",
  "change_plan_budget_without_human",
  "claim_approval",
] as const;

export type BuildReplacementSupportEvidencePackInput = {
  request: ReplacementSupportRequest;
  calculations: ReplacementSupportCalculations;
};

/**
 * Build an NDIS-oriented replacement support evidence JSON bundle.
 * Never auto-approves or submits — DRAFT_ONLY with human confirmation required.
 */
export function buildReplacementSupportEvidencePack(
  input: BuildReplacementSupportEvidencePackInput
): ReplacementSupportEvidencePack {
  const { request, calculations } = input;
  const deviceLabel = `${request.proposedDevice.name} (${request.proposedDevice.model})`;
  const domainLabels = request.icanDomainDeficit.map(
    (key) => ICAN_V6_DOMAIN_LABELS[key]
  );

  return {
    authorityCeiling: "DRAFT_ONLY",
    actionTaken: false,
    requiresHumanConfirmation: true,
    editable: true,
    supportCategory: "replacement_supports",
    framework: "NDIS",
    summary: `Mainstream device ${deviceLabel} proposed as a Replacement Support to reduce ${request.replacedSupportHoursPerWeek} support-worker hours/week across: ${domainLabels.join(", ")}. Estimated net 12-month plan savings: $${calculations.net12MonthSavingsAUD.toFixed(2)} AUD.`,
    participantId: request.participantId,
    icanDomainDeficit: request.icanDomainDeficit,
    icanDomainLabels: domainLabels,
    proposedDevice: request.proposedDevice,
    replacedSupportHoursPerWeek: request.replacedSupportHoursPerWeek,
    hourlyWorkerRateAUD: request.hourlyWorkerRateAUD,
    clinicalJustification: {
      notes: request.justificationNotes,
      rationale:
        "Under NDIS guidelines, mainstream consumer devices may be claimed as Replacement Supports where they reduce or replace the need for physical support worker hours. This draft portfolio links I-CAN v6 domain deficits to a quantified cost-benefit projection for NDIA or Plan Manager review.",
    },
    costBenefit: calculations,
    prohibited: PROHIBITED,
  };
}

export type ReplacementSupportAuditLogPayload = {
  action: "replacement_support_evidence_generated";
  actorUserId: string;
  evidencePackId: string;
  participantId: string;
  summary: string;
  createdAt: string;
};
