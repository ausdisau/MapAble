import { randomUUID } from "crypto";

import { accessIntelligenceNextFlags } from "@/lib/access/intelligence-next/flags";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import type { AccessEvidenceClass } from "./classes";
import {
  createEvidenceEnvelope,
  type AccessEvidenceEnvelope,
  type AccessEvidenceReference,
} from "./envelope";
import {
  computeExpiryFromObservedAt,
  freshnessPolicyForConcept,
  type FreshnessPolicyKey,
} from "./freshness-policy";

export class AccessEvidencePersistError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AccessEvidencePersistError";
    this.status = status;
  }
}

export function isDurableEvidenceEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    accessIntelligenceNextFlags.enabled &&
    (env.MAPABLE_ACCESS_EVIDENCE_PERSISTENCE_ENABLED === "true" ||
      env.MAPABLE_ACCESS_EVIDENCE_PERSISTENCE_ENABLED === "1")
  );
}

export type PersistEvidenceObservationInput = {
  subjectCanonicalRef: string;
  subjectNodeId?: string;
  placeId?: string | null;
  featureKey?: string;
  ontologyConceptId: string;
  evidenceClass: AccessEvidenceClass;
  source: string;
  summary: string;
  limitations?: string[];
  observedAt?: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  precisionNote?: string;
  confidenceBasis?: string;
  verificationStatus?: string;
  contributorMode?: "private" | "acknowledged";
  createdById?: string | null;
  /** Existing conflicting evidence IDs — preserved, never averaged. */
  conflictWithEvidenceIds?: string[];
  conflictNote?: string;
};

export type PersistedEvidenceEnvelope = {
  id: string;
  envelope: AccessEvidenceEnvelope;
  conflictState: string;
  verificationStatus: string;
  freshnessPolicyKey: FreshnessPolicyKey;
  expiresAt: string | null;
  durable: true;
  productionClaim: "none";
  autoPublished: false;
};

/**
 * Persist a purpose-bound evidence observation as an envelope.
 * Conflicts are preserved; model candidates stay unverified.
 * Never writes AccessPlace features automatically.
 */
export async function persistEvidenceObservation(
  input: PersistEvidenceObservationInput,
): Promise<PersistedEvidenceEnvelope> {
  if (!isDurableEvidenceEnabled()) {
    throw new AccessEvidencePersistError(
      "Durable access evidence persistence is not enabled",
      503,
    );
  }

  if (accessIntelligenceNextFlags.enabled === false) {
    throw new AccessEvidencePersistError("Access Intelligence Next is disabled", 503);
  }

  const observedAt = input.observedAt ?? new Date().toISOString();
  const policy = freshnessPolicyForConcept(input.ontologyConceptId);
  const expiresAt = computeExpiryFromObservedAt(new Date(observedAt), policy);

  const reference: AccessEvidenceReference = {
    evidenceId: `ev:${randomUUID()}`,
    class: input.evidenceClass,
    ontologyConceptId: input.ontologyConceptId,
    source: input.source,
    observedAt,
    effectiveFrom: input.effectiveFrom ?? observedAt,
    effectiveTo: input.effectiveTo ?? null,
    summary: input.summary,
    limitations: [
      ...(input.limitations ?? []),
      "Persisted envelope is not a safety guarantee",
      "Does not auto-publish to AccessPlace",
    ],
  };

  const conflicts =
    input.conflictWithEvidenceIds?.map((leftId) => ({
      conceptId: input.ontologyConceptId,
      leftEvidenceId: leftId,
      rightEvidenceId: reference.evidenceId,
      note:
        input.conflictNote ??
        "Conflicting evidence preserved — not averaged into false confidence",
    })) ?? [];

  const envelope = createEvidenceEnvelope({
    envelopeId: `env:${randomUUID()}`,
    subjectCanonicalRef: input.subjectCanonicalRef,
    references: [reference],
    conflicts,
  });

  const verificationStatus =
    input.verificationStatus ??
    (input.evidenceClass === "model_candidate" ||
    input.evidenceClass === "device_assisted_estimate"
      ? "candidate_unverified"
      : "unverified");

  const conflictState = conflicts.length > 0 ? "conflict_preserved" : "none";

  if (input.placeId) {
    const place = await prisma.accessPlace.findUnique({
      where: { id: input.placeId },
      select: { id: true },
    });
    if (!place) {
      throw new AccessEvidencePersistError("placeId not found — AccessPlace remains SoT", 404);
    }
  }

  const row = await prisma.accessEvidenceEnvelopeRecord.create({
    data: {
      envelopeId: envelope.envelopeId,
      placeId: input.placeId ?? null,
      subjectCanonicalRef: input.subjectCanonicalRef,
      subjectNodeId: input.subjectNodeId ?? null,
      featureKey: input.featureKey ?? input.ontologyConceptId,
      evidenceClasses: [input.evidenceClass],
      envelopeJson: envelope,
      conflictState,
      verificationStatus,
      observedAt: new Date(observedAt),
      effectiveFrom: new Date(input.effectiveFrom ?? observedAt),
      effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
      freshnessPolicyKey: policy.key,
      expiresAt,
      precisionNote: input.precisionNote ?? null,
      confidenceBasis: input.confidenceBasis ?? `evidence_class:${input.evidenceClass}`,
      contributorMode: input.contributorMode ?? "private",
      createdById: input.createdById ?? null,
    },
  });

  await createAuditEvent({
    actorUserId: input.createdById,
    action: "access_intelligence.evidence_envelope.persisted",
    entityType: "AccessEvidenceEnvelopeRecord",
    entityId: row.id,
    metadata: {
      envelopeId: envelope.envelopeId,
      subjectCanonicalRef: input.subjectCanonicalRef,
      evidenceClass: input.evidenceClass,
      conflictState,
      verificationStatus,
      freshnessPolicyKey: policy.key,
      autoPublished: false,
    },
  });

  return {
    id: row.id,
    envelope,
    conflictState,
    verificationStatus,
    freshnessPolicyKey: policy.key,
    expiresAt: expiresAt.toISOString(),
    durable: true,
    productionClaim: "none",
    autoPublished: false,
  };
}

export async function getPersistedEnvelope(envelopeId: string) {
  if (!isDurableEvidenceEnabled()) {
    throw new AccessEvidencePersistError(
      "Durable access evidence persistence is not enabled",
      503,
    );
  }
  return prisma.accessEvidenceEnvelopeRecord.findUnique({
    where: { envelopeId },
  });
}

export async function listPersistedEnvelopesForSubject(subjectCanonicalRef: string) {
  if (!isDurableEvidenceEnabled()) {
    throw new AccessEvidencePersistError(
      "Durable access evidence persistence is not enabled",
      503,
    );
  }
  return prisma.accessEvidenceEnvelopeRecord.findMany({
    where: { subjectCanonicalRef },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
