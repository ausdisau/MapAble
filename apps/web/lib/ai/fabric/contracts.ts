/**
 * Versioned, payload-free contracts for MapAble AI Fabric event projections.
 * HAL.guru's YAML schemas are external configuration schemas; this independent
 * schema must not be presented as a validated .halguru.yaml contract.
 */
import { z } from "zod";

export const AI_FABRIC_TOPICS = {
  observations: "mapable.ai.observations.v1",
  accessEvidence: "mapable.ai.access-evidence.v1",
  reviews: "mapable.ai.human-review.v1",
  consent: "mapable.ai.consent-lifecycle.v1"
} as const;

export const aiFabricEventSchema = z.strictObject({
  schemaVersion: z.literal(1),
  eventId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  moduleId: z.string().min(3).max(100),
  kind: z.enum([
    "ai.run_observed",
    "ai.draft_prepared",
    "ai.review_required",
    "access.evidence_candidate_detected",
    "access.change_reviewed",
    "consent.withdrawal_observed"
  ]),
  environment: z.enum(["synthetic", "shadow"]),
  /** Salted-HMAC digests calculated by a trusted server. Never raw IDs. */
  tenantDigest: z.string().regex(/^[a-f0-9]{64}$/),
  aggregateDigest: z.string().regex(/^[a-f0-9]{64}$/),
  /** Opaque evidence keys only; no summaries, location, diagnoses or prompts. */
  evidenceRefs: z.array(z.string().max(128)).max(20),
  outcome: z.enum(["observed", "candidate", "needs_human_review", "reviewed", "withdrawn"]),
  requiresHumanReview: z.boolean(),
  dataClass: z.enum(["public", "operational"]),
  autoPublished: z.literal(false)
});

export type AiFabricEvent = z.infer<typeof aiFabricEventSchema>;
export type AiFabricTopic = (typeof AI_FABRIC_TOPICS)[keyof typeof AI_FABRIC_TOPICS];

export function topicForFabricEvent(event: AiFabricEvent): AiFabricTopic {
  if (event.kind.startsWith("access.")) return AI_FABRIC_TOPICS.accessEvidence;
  if (event.kind === "ai.review_required") return AI_FABRIC_TOPICS.reviews;
  if (event.kind === "consent.withdrawal_observed") return AI_FABRIC_TOPICS.consent;
  return AI_FABRIC_TOPICS.observations;
}

export function parseFabricEvent(input: unknown): AiFabricEvent {
  return aiFabricEventSchema.parse(input);
}
