/**
 * GET /api/ndis/proda/status — PRODA integration status (admin)
 * Ported from REPL GET /api/ndis/proda-status.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getProdaIntegrationStatus } from "@/lib/ndis/proda-client";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(getProdaIntegrationStatus());
}
