/**
 * POST /api/chat/guardrails/classify
 *
 * Classifies a chat turn input and runs all side-effect DB writes (audit log,
 * safeguarding flags, incident/complaint/consent drafts).
 *
 * Ported from REPL server/chat-guardrails.ts + server/chat-engine.ts.
 *
 * Request body:
 *   { sessionId: string, turnIndex: number, input: string }
 *
 * Response:
 *   { verdict: GuardrailVerdict, sideEffectsDispatched: boolean }
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { classifyUserTurn } from "@/lib/chat/guardrails/classify";
import { dispatchGuardrailSideEffects } from "@/lib/chat/guardrails/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const body = await req.json();
  const { sessionId, turnIndex, input } = body;
  if (!sessionId || typeof input !== "string") {
    return NextResponse.json({ error: "sessionId and input are required" }, { status: 400 });
  }

  const isStaff = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      }).then((u) => ["admin", "provider", "staff"].includes(u?.role ?? ""))
    : false;

  const verdict = classifyUserTurn(input, isStaff);

  // Dispatch side-effects (audit log, safeguarding flags, drafts)
  await dispatchGuardrailSideEffects(prisma as any, {
    sessionId,
    userId,
    turnIndex: turnIndex ?? 0,
    input,
    verdict,
    outputBlocked: verdict.blocked,
    sendSmsAlert: async (message: string) => {
      // Wire to mapableau-new's Twilio SMS service
      // import { sendSms } from "@/lib/notifications/twilio";
      // await sendSms(process.env.SAFEGUARDING_ALERT_PHONE!, message);
      console.warn("[guardrails] SMS alert (not wired):", message);
    },
  });

  return NextResponse.json({ verdict, sideEffectsDispatched: true });
}
