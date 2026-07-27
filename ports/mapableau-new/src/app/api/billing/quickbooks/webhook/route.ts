/**
 * POST /api/billing/quickbooks/webhook — QB payment event webhook
 * Ported from REPL POST /api/quickbooks/webhook.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyQbWebhookSignature,
  qbEnabled,
} from "@/lib/billing/quickbooks/client";
import {
  handleQbWebhook,
  pullPaymentsFromQb,
} from "@/lib/billing/quickbooks/sync";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!qbEnabled()) return NextResponse.json({ received: false }, { status: 503 });

  const rawBody = await req.text();
  const sig = req.headers.get("intuit-signature") ?? "";
  if (!verifyQbWebhookSignature(rawBody, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: any;
  try { payload = JSON.parse(rawBody); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await handleQbWebhook(
    prisma as any,
    payload,
    async (id) => prisma.user.findUnique({
      where: { id },
      select: { id: true, fullName: true, email: true, ndisNumber: true,
        qbAccessToken: true, qbRefreshToken: true, qbRealmId: true, qbTokenExpiresAt: true },
    }) as any,
    async (userId) => prisma.invoice.findMany({
      where: { participantId: userId, status: { not: "paid" }, qbInvoiceId: { not: null } },
    }) as any,
    async (realmId) => prisma.user.findMany({
      where: { qbRealmId: realmId },
      select: { id: true },
    }),
  );

  return NextResponse.json({ received: true });
}
