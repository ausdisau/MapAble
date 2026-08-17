import { NextResponse } from "next/server";
import { z } from "zod";

import {
  accessIntelligenceNextFlags,
  AccessChangeReviewPersistError,
  decideChangeReview,
  isDurableEvidenceEnabled,
  listPendingChangeReviews,
} from "@/lib/access/intelligence-next";
import { requireApiSession } from "@/lib/api/auth-handler";
import { isAdminRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

const decideSchema = z
  .object({
    reviewId: z.string().min(1),
    decision: z.enum([
      "accepted_as_temporary",
      "accepted_as_update",
      "rejected",
      "needs_more_evidence",
      "escalated",
    ]),
    note: z.string().max(1000).optional(),
  })
  .strict();

export async function GET() {
  if (!accessIntelligenceNextFlags.enabled || !isDurableEvidenceEnabled()) {
    return NextResponse.json(
      { error: "Durable access evidence is disabled" },
      { status: 404 },
    );
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isAdminRole(user.primaryRole) && user.primaryRole !== "provider_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reviews = await listPendingChangeReviews();
  return NextResponse.json({
    productionClaim: "none",
    autoPublish: false,
    reviews,
  });
}

export async function POST(request: Request) {
  if (!accessIntelligenceNextFlags.enabled || !isDurableEvidenceEnabled()) {
    return NextResponse.json(
      { error: "Durable access evidence is disabled" },
      { status: 404 },
    );
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isAdminRole(user.primaryRole) && user.primaryRole !== "provider_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const parsed = decideSchema.parse(body);
    const result = await decideChangeReview({
      reviewId: parsed.reviewId,
      reviewerId: user.id,
      decision: parsed.decision,
      note: parsed.note,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AccessChangeReviewPersistError) {
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
