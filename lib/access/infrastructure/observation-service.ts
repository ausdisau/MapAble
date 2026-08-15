/**
 * Access Graph observation service (Epic 01 G3).
 * observation → store → read with provenance + freshness.
 * Never silently overwrites verified facts; AI cannot store as verified.
 */

import type { AccessProvenanceStatus, Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { ACCESS_ENTITY_TYPES, type AccessEntityType } from "./domains";
import { accessInfrastructureFlags } from "./flags";
import {
  computeExpiryFromObservedAt,
  evaluateObservationFreshness,
  freshnessPolicyForConcept,
  type FreshnessEvaluation,
} from "./freshness";
import {
  ACCESS_OBSERVATION_SOURCE_TYPES,
  ACCESS_SOURCE_CLASSES,
  assertAiCannotBeVerified,
  buildProvenanceDisplay,
  resolveCreateVerificationStatus,
  sourceTypeToSourceClass,
  type AccessObservationSourceType,
  type AccessSourceClass,
  type ProvenanceDisplay,
} from "./provenance";

export class AccessGraphError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AccessGraphError";
    this.status = status;
  }
}

function parseEntityType(
  raw: string | null | undefined,
): AccessEntityType | null {
  if (!raw) return null;
  if ((ACCESS_ENTITY_TYPES as readonly string[]).includes(raw)) {
    return raw as AccessEntityType;
  }
  throw new AccessGraphError(
    `Invalid entityType: ${raw}. Allowed: ${ACCESS_ENTITY_TYPES.join(", ")}`,
  );
}

export function assertAccessGraphEnabled(): void {
  if (!accessInfrastructureFlags.graphApisEnabled) {
    throw new AccessGraphError(
      "Access Graph APIs are disabled (require MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED and MAPABLE_ACCESS_GRAPH_ENABLED)",
      404,
    );
  }
}

export type CreateAccessObservationInput = {
  featureKey: string;
  ontologyConceptId: string;
  value: string | number | boolean;
  unit?: string | null;
  sourceType: AccessObservationSourceType;
  observedAt?: string;
  evidenceKinds?: string[];
  verificationStatus?: AccessProvenanceStatus;
  confidence?: number | null;
  placeId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  observerUserId?: string | null;
  disputed?: boolean;
};

export type AccessObservationEnvelope = {
  id: string;
  featureKey: string;
  ontologyConceptId: string;
  value: string | number | boolean;
  unit: string | null;
  sourceType: AccessObservationSourceType;
  observedAt: string;
  evidenceKinds: string[];
  confidence: number | null;
  disputed: boolean;
  placeId: string | null;
  entityType: string | null;
  entityId: string | null;
  observerUserId: string | null;
  provenance: ProvenanceDisplay;
  freshness: FreshnessEvaluation;
  productionClaim: "none";
  claimState: "in_development";
};

function parseSourceType(raw: string): AccessObservationSourceType {
  if (
    (ACCESS_OBSERVATION_SOURCE_TYPES as readonly string[]).includes(raw)
  ) {
    return raw as AccessObservationSourceType;
  }
  throw new AccessGraphError(
    `Invalid sourceType: ${raw}. Allowed: ${ACCESS_OBSERVATION_SOURCE_TYPES.join(", ")}`,
  );
}

function coerceValue(valueJson: Prisma.JsonValue): string | number | boolean {
  if (
    typeof valueJson === "string" ||
    typeof valueJson === "number" ||
    typeof valueJson === "boolean"
  ) {
    return valueJson;
  }
  if (valueJson && typeof valueJson === "object" && !Array.isArray(valueJson)) {
    const v = (valueJson as { value?: unknown }).value;
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      return v;
    }
  }
  return JSON.stringify(valueJson);
}

export function serializeObservationRow(
  row: {
    id: string;
    featureKey: string;
    ontologyConceptId: string;
    valueJson: Prisma.JsonValue;
    unit: string | null;
    sourceType: string;
    observedAt: Date;
    evidenceKinds: string[];
    verificationStatus: AccessProvenanceStatus;
    confidence: number | null;
    reviewDue: Date | null;
    disputed: boolean;
    placeId: string | null;
    entityType: string | null;
    entityId: string | null;
    observerUserId: string | null;
  },
  now: Date = new Date(),
): AccessObservationEnvelope {
  const safeSourceType: AccessObservationSourceType =
    (ACCESS_OBSERVATION_SOURCE_TYPES as readonly string[]).includes(row.sourceType)
      ? (row.sourceType as AccessObservationSourceType)
      : "synthetic";

  const freshness = evaluateObservationFreshness({
    ontologyConceptId: row.ontologyConceptId,
    observedAt: row.observedAt,
    reviewDue: row.reviewDue,
    now,
  });

  const provenance = buildProvenanceDisplay({
    sourceType: safeSourceType,
    evidenceKinds: row.evidenceKinds,
    verificationStatus: row.verificationStatus,
    freshnessExpired: freshness.expired,
  });

  return {
    id: row.id,
    featureKey: row.featureKey,
    ontologyConceptId: row.ontologyConceptId,
    value: coerceValue(row.valueJson),
    unit: row.unit,
    sourceType: safeSourceType,
    observedAt: row.observedAt.toISOString(),
    evidenceKinds: row.evidenceKinds,
    confidence: row.confidence,
    disputed: row.disputed,
    placeId: row.placeId,
    entityType: row.entityType,
    entityId: row.entityId,
    observerUserId: row.observerUserId,
    provenance,
    freshness,
    productionClaim: "none",
    claimState: "in_development",
  };
}

export async function createAccessObservation(
  input: CreateAccessObservationInput,
): Promise<AccessObservationEnvelope> {
  assertAccessGraphEnabled();

  if (!input.featureKey?.trim() || !input.ontologyConceptId?.trim()) {
    throw new AccessGraphError("featureKey and ontologyConceptId are required");
  }

  if (
    input.value === undefined ||
    input.value === null ||
    (typeof input.value !== "string" &&
      typeof input.value !== "number" &&
      typeof input.value !== "boolean")
  ) {
    throw new AccessGraphError("value must be a string, number, or boolean");
  }

  const sourceType = parseSourceType(input.sourceType);
  let evidenceKinds = [...(input.evidenceKinds ?? [])];
  if (sourceType === "ai" && !evidenceKinds.includes("ai_inferred")) {
    evidenceKinds = [...evidenceKinds, "ai_inferred"];
  }

  try {
    assertAiCannotBeVerified({
      sourceType,
      evidenceKinds,
      verificationStatus: input.verificationStatus,
    });
  } catch (err) {
    throw new AccessGraphError(
      err instanceof Error ? err.message : "Invalid AI verification status",
      400,
    );
  }

  const sourceClass: AccessSourceClass = sourceTypeToSourceClass(
    sourceType,
    evidenceKinds,
  );

  if (
    !(ACCESS_SOURCE_CLASSES as readonly string[]).includes(sourceClass)
  ) {
    throw new AccessGraphError(`Unsupported source class: ${sourceClass}`);
  }

  const verificationStatus = resolveCreateVerificationStatus({
    sourceClass,
    requestedStatus: input.verificationStatus,
  });

  if (sourceClass === "ai_inferred" && verificationStatus === "verified") {
    throw new AccessGraphError(
      "AI-inferred observations cannot be stored as independently verified",
    );
  }

  const observedAt = input.observedAt
    ? new Date(input.observedAt)
    : new Date();
  if (Number.isNaN(observedAt.getTime())) {
    throw new AccessGraphError("observedAt must be a valid ISO timestamp");
  }

  const policy = freshnessPolicyForConcept(input.ontologyConceptId);
  const reviewDue = computeExpiryFromObservedAt(observedAt, policy);

  if (input.placeId) {
    const place = await prisma.accessPlace.findUnique({
      where: { id: input.placeId },
      select: { id: true },
    });
    if (!place) {
      throw new AccessGraphError(`Unknown placeId: ${input.placeId}`, 404);
    }
  }

  const created = await prisma.accessObservationRecord.create({
    data: {
      featureKey: input.featureKey.trim(),
      ontologyConceptId: input.ontologyConceptId.trim(),
      valueJson: input.value,
      unit: input.unit ?? null,
      sourceType,
      observedAt,
      evidenceKinds,
      verificationStatus,
      confidence: input.confidence ?? null,
      reviewDue,
      disputed: input.disputed ?? false,
      placeId: input.placeId ?? null,
      entityType: parseEntityType(input.entityType),
      entityId: input.entityId ?? null,
      observerUserId: input.observerUserId ?? null,
    },
  });

  await createAuditEvent({
    actorUserId: input.observerUserId ?? null,
    action: "access_graph.observation_created",
    entityType: "AccessObservationRecord",
    entityId: created.id,
    metadata: {
      placeId: created.placeId,
      ontologyConceptId: created.ontologyConceptId,
      sourceType: created.sourceType,
      verificationStatus: created.verificationStatus,
      sourceClass,
      productionClaim: "none",
    },
  });

  return serializeObservationRow(created);
}

export async function listAccessObservations(input: {
  placeId?: string;
  ontologyConceptId?: string;
  limit?: number;
}): Promise<AccessObservationEnvelope[]> {
  assertAccessGraphEnabled();

  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  const rows = await prisma.accessObservationRecord.findMany({
    where: {
      ...(input.placeId ? { placeId: input.placeId } : {}),
      ...(input.ontologyConceptId
        ? { ontologyConceptId: input.ontologyConceptId }
        : {}),
    },
    orderBy: { observedAt: "desc" },
    take: limit,
  });

  const now = new Date();
  return rows.map((row) => serializeObservationRow(row, now));
}

export async function getAccessObservation(
  id: string,
): Promise<AccessObservationEnvelope> {
  assertAccessGraphEnabled();

  const row = await prisma.accessObservationRecord.findUnique({
    where: { id },
  });
  if (!row) {
    throw new AccessGraphError(`Observation not found: ${id}`, 404);
  }
  return serializeObservationRow(row);
}

export async function getPlaceAccessGraph(placeId: string): Promise<{
  placeId: string;
  observations: AccessObservationEnvelope[];
  featureCount: number;
  expiredCount: number;
  unverifiedCount: number;
  productionClaim: "none";
  claimState: "in_development";
  note: string;
}> {
  assertAccessGraphEnabled();

  const place = await prisma.accessPlace.findUnique({
    where: { id: placeId },
    select: { id: true },
  });
  if (!place) {
    throw new AccessGraphError(`Place not found: ${placeId}`, 404);
  }

  const observations = await listAccessObservations({ placeId, limit: 200 });
  return {
    placeId,
    observations,
    featureCount: new Set(observations.map((o) => o.ontologyConceptId)).size,
    expiredCount: observations.filter((o) => o.freshness.expired).length,
    unverifiedCount: observations.filter((o) => o.provenance.unverified).length,
    productionClaim: "none",
    claimState: "in_development",
    note: "Unknown ≠ inaccessible. AI-inferred and expired assertions are never presented as verified fact.",
  };
}
