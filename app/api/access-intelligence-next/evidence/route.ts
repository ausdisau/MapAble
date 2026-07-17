import { NextResponse } from "next/server";
import { z } from "zod";

import {
  accessIntelligenceNextFlags,
  AccessEvidencePersistError,
  HARBOUR_PILOT,
  isDurableEvidenceEnabled,
  listPersistedEnvelopesForSubject,
  persistEvidenceObservation,
} from "@/lib/access-intelligence-next";
import { requireApiSession } from "@/lib/api/auth-handler";

export const dynamic = "force-dynamic";

const observationSchema = z
  .object({
    subjectNodeId: z.string().min(1),
    ontologyConceptId: z.string().min(1),
    evidenceClass: z.enum([
      "synthetic_fixture",
      "model_candidate",
      "participant_observation",
      "community_observation",
      "venue_declaration",
      "mapper_observation",
      "device_assisted_estimate",
      "manual_measurement",
      "professional_measurement",
      "operational_sensor",
      "authoritative_public_source",
      "moderated_claim",
      "independently_verified_claim",
    ]),
    source: z.string().min(1).max(200),
    summary: z.string().min(3).max(1000),
    limitations: z.array(z.string()).max(20).optional(),
    observedAt: z.string().datetime().optional(),
    effectiveTo: z.string().datetime().nullable().optional(),
    precisionNote: z.string().max(500).optional(),
    confidenceBasis: z.string().max(500).optional(),
    conflictWithEvidenceIds: z.array(z.string()).max(10).optional(),
    conflictNote: z.string().max(500).optional(),
    contributorMode: z.enum(["private", "acknowledged"]).optional(),
    placeId: z.string().min(1).optional(),
  })
  .strict();

/** GET list of persisted envelopes for Harbour pilot subject (or ?subject=). */
export async function GET(request: Request) {
  if (!accessIntelligenceNextFlags.enabled || !isDurableEvidenceEnabled()) {
    return NextResponse.json(
      { error: "Durable access evidence is disabled" },
      { status: 404 },
    );
  }

  const subject =
    new URL(request.url).searchParams.get("subject") ??
    HARBOUR_PILOT.venueCanonicalRef;
  const rows = await listPersistedEnvelopesForSubject(subject);
  return NextResponse.json({
    productionClaim: "none",
    harbourPilot: HARBOUR_PILOT,
    subjectCanonicalRef: subject,
    envelopes: rows.map((row) => ({
      id: row.id,
      envelopeId: row.envelopeId,
      subjectNodeId: row.subjectNodeId,
      featureKey: row.featureKey,
      evidenceClasses: row.evidenceClasses,
      conflictState: row.conflictState,
      verificationStatus: row.verificationStatus,
      freshnessPolicyKey: row.freshnessPolicyKey,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      contributorMode: row.contributorMode,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}

/** POST persist a single observation envelope (no AccessPlace auto-write). */
export async function POST(request: Request) {
  if (!accessIntelligenceNextFlags.enabled || !isDurableEvidenceEnabled()) {
    return NextResponse.json(
      { error: "Durable access evidence is disabled" },
      { status: 404 },
    );
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const parsed = observationSchema.parse(body);
    const result = await persistEvidenceObservation({
      ...parsed,
      subjectCanonicalRef: HARBOUR_PILOT.venueCanonicalRef,
      createdById: user.id,
    });
    return NextResponse.json(
      {
        ...result,
        harbourPilot: HARBOUR_PILOT,
        notice: HARBOUR_PILOT.notice,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof AccessEvidencePersistError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.flatten() },
        { status: 400 },
      );
    }
    throw err;
  }
}
