/**
 * GET  /api/ndis/proda/plan?ndisNumber=...  — fetch participant plan from PRODA
 * POST /api/ndis/proda/plan                 — sync & cache participant plan
 *
 * Ported from REPL GET /api/ndis/participant-plan and POST /api/ndis/sync-plan.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  fetchParticipantPlan,
  ProdaNotConfiguredError,
  ProdaApiError,
  prodaConfigured,
} from "@/lib/ndis/proda-client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const ndisNumber = req.nextUrl.searchParams.get("ndisNumber");
  if (!ndisNumber) return NextResponse.json({ error: "ndisNumber is required" }, { status: 400 });

  // Check cache first
  const cached = await prisma.ndisPlanCache.findFirst({
    where: { participantId: session.user.id },
    orderBy: { fetchedAt: "desc" },
  });
  if (cached) return NextResponse.json({ plan: cached.planData, goals: cached.goals, cachedAt: cached.fetchedAt });

  if (!prodaConfigured()) {
    return NextResponse.json({ error: "PRODA not configured" }, { status: 503 });
  }

  try {
    const plan = await fetchParticipantPlan(session.user.id, ndisNumber);
    await prisma.ndisPlanCache.upsert({
      where: { participantId: session.user.id },
      create: { participantId: session.user.id, planData: plan as any, goals: (plan.goals as any) ?? [], fetchedAt: new Date() },
      update: { planData: plan as any, goals: (plan.goals as any) ?? [], fetchedAt: new Date() },
    });
    return NextResponse.json({ plan, goals: plan.goals });
  } catch (e) {
    if (e instanceof ProdaNotConfiguredError) return NextResponse.json({ error: e.message, missingEnvVars: e.missingEnvVars }, { status: 503 });
    if (e instanceof ProdaApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "PRODA request failed" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { ndisNumber } = await req.json();
  if (!ndisNumber) return NextResponse.json({ error: "ndisNumber is required" }, { status: 400 });

  if (!prodaConfigured()) return NextResponse.json({ error: "PRODA not configured" }, { status: 503 });

  try {
    const plan = await fetchParticipantPlan(session.user.id, ndisNumber);
    const record = await prisma.ndisPlanCache.upsert({
      where: { participantId: session.user.id },
      create: { participantId: session.user.id, planData: plan as any, goals: (plan.goals as any) ?? [], fetchedAt: new Date() },
      update: { planData: plan as any, goals: (plan.goals as any) ?? [], fetchedAt: new Date() },
    });
    return NextResponse.json({ record, plan });
  } catch (e) {
    if (e instanceof ProdaNotConfiguredError) return NextResponse.json({ error: e.message, missingEnvVars: e.missingEnvVars }, { status: 503 });
    if (e instanceof ProdaApiError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "PRODA sync failed" }, { status: 502 });
  }
}
