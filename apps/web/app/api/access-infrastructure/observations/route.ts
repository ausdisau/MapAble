import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  AccessGraphError,
  createAccessObservation,
  listAccessObservations,
} from "@/lib/access/infrastructure/observation-service";
import {
  ACCESS_OBSERVATION_SOURCE_TYPES,
} from "@/lib/access/infrastructure/provenance";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  featureKey: z.string().min(1).max(200),
  ontologyConceptId: z.string().min(1).max(200),
  value: z.union([z.string(), z.number(), z.boolean()]),
  unit: z.string().max(40).nullable().optional(),
  sourceType: z.enum(ACCESS_OBSERVATION_SOURCE_TYPES),
  observedAt: z.string().datetime().optional(),
  evidenceKinds: z.array(z.string().max(80)).max(20).optional(),
  verificationStatus: z
    .enum([
      "verified",
      "observed",
      "venue_reported",
      "community_reported",
      "unknown",
      "outdated",
      "disputed",
    ])
    .optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  placeId: z.string().min(1).nullable().optional(),
  entityType: z.string().min(1).nullable().optional(),
  entityId: z.string().min(1).nullable().optional(),
  disputed: z.boolean().optional(),
});

/**
 * GET /api/access-infrastructure/observations
 * List Access Graph observations with provenance + freshness (flag-gated).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("placeId") ?? undefined;
    const ontologyConceptId =
      searchParams.get("ontologyConceptId") ?? undefined;
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : undefined;

    const observations = await listAccessObservations({
      placeId,
      ontologyConceptId,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    return NextResponse.json({
      framework: "access_as_infrastructure",
      epic: "mapable-epic-01-access-graph",
      productionClaim: "none",
      claimState: "in_development",
      count: observations.length,
      observations,
      note: "Unknown ≠ inaccessible. AI-inferred assertions are labelled unverified.",
    });
  } catch (err) {
    if (err instanceof AccessGraphError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

/**
 * POST /api/access-infrastructure/observations
 * Create an observation. AI-inferred cannot be stored as verified.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid observation payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const observation = await createAccessObservation({
      ...parsed.data,
      observerUserId: session.user.id,
    });

    return NextResponse.json(
      {
        framework: "access_as_infrastructure",
        epic: "mapable-epic-01-access-graph",
        productionClaim: "none",
        observation,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof AccessGraphError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
