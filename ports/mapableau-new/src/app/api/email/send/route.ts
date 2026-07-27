/**
 * POST /api/email/send  — send an email via AgentMail
 * Ported from REPL agentmail-service.ts POST /api/email/send.
 * Staff/admin only.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { sendEmail, agentMailEnabled } from "@/lib/email/agentmail";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!["admin", "provider", "staff"].includes(user?.role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!agentMailEnabled()) return NextResponse.json({ error: "AgentMail not configured" }, { status: 503 });

  const { inbox_id, to, subject, text, html } = await req.json();
  if (!inbox_id || !to || !subject) return NextResponse.json({ error: "inbox_id, to, and subject are required" }, { status: 400 });

  const message = await sendEmail(inbox_id, to, subject, text || "", html);
  return NextResponse.json(message, { status: 201 });
}
