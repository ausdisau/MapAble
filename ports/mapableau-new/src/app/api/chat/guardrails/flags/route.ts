/**
 * GET  /api/chat/guardrails/flags         — list safeguarding concern flags (staff)
 * PATCH /api/chat/guardrails/flags/[id]   — update flag status
 *
 * Ported from REPL GET/PATCH /api/admin/chat-guardrails.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  getSafeguardingConcernFlags,
  updateSafeguardingConcernStatus,
} from "@/lib/chat/guardrails/audit";

async function requireStaff(session: any) {
  if (!session?.user?.id) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return ["admin", "staff"].includes(user?.role ?? "");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!await requireStaff(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "50"), 100);
  const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");

  const flags = await getSafeguardingConcernFlags(prisma as any, { status, limit, offset });
  return NextResponse.json(flags);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!await requireStaff(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status, reviewNote } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "id and status are required" }, { status: 400 });

  const updated = await updateSafeguardingConcernStatus(
    prisma as any,
    id,
    status,
    session.user!.id,
    reviewNote,
  );
  return NextResponse.json(updated);
}
