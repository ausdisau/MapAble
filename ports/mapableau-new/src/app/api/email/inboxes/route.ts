/**
 * GET  /api/email/inboxes  — list AgentMail inboxes
 * POST /api/email/inboxes  — create an AgentMail inbox
 *
 * Ported from REPL agentmail-service.ts (GET/POST /api/email/inboxes).
 * Staff/admin only.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createInbox, listInboxes, agentMailEnabled } from "@/lib/email/agentmail";

async function requireStaff(session: any) {
  if (!session?.user?.id) return false;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return ["admin", "provider", "staff"].includes(user?.role ?? "");
}

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!await requireStaff(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!agentMailEnabled()) return NextResponse.json({ error: "AgentMail not configured" }, { status: 503 });
  const inboxes = await listInboxes();
  return NextResponse.json(inboxes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!await requireStaff(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!agentMailEnabled()) return NextResponse.json({ error: "AgentMail not configured" }, { status: 503 });
  const { username, display_name } = await req.json();
  const inbox = await createInbox(
    username || "mapable-notifications",
    display_name || "MapAble Notifications",
  );
  return NextResponse.json(inbox, { status: 201 });
}
