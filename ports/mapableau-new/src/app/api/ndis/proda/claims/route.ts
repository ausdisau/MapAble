/**
 * POST /api/ndis/proda/claims  — submit a claim to PRODA
 * GET  /api/ndis/proda/claims  — list recent claims (admin)
 *
 * Ported from REPL POST /api/ndis/submit-claim and GET /api/ndis/claims.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  submitNdisClaim,
  ProdaNotConfiguredError,
  ProdaApiError,
  prodaConfigured,
} from "@/lib/ndis/proda-client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  if (!prodaConfigured()) {
    return NextResponse.json({ error: "PRODA not configured" }, { status: 503 });
  }

  const body = await req.json();
  const { participantId, ndisProviderRef, invoiceId, serviceSessionId,
    itemCode, quantity, unitPrice, serviceDate, claimReference } = body;

  if (!participantId || !ndisProviderRef || !itemCode || !quantity || !unitPrice || !serviceDate || !claimReference) {
    return NextResponse.json({ error: "Missing required claim fields" }, { status: 400 });
  }

  try {
    const result = await submitNdisClaim(prisma as any, {
      participantId,
      providerId: session.user.id,
      ndisProviderRef,
      invoiceId,
      serviceSessionId,
      itemCode,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      serviceDate,
      claimReference,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof ProdaNotConfiguredError) return NextResponse.json({ error: e.message, missingEnvVars: e.missingEnvVars }, { status: 503 });
    if (e instanceof ProdaApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Claim submission failed" }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  // Admin/provider only — check role in mapableau-new's RBAC system
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || !["admin", "provider"].includes(user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "20"), 100);
  const claims = await prisma.ndisClaim.findMany({
    orderBy: { submittedAt: "desc" },
    take: limit,
  });
  return NextResponse.json(claims);
}
