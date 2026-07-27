/**
 * POST /api/webhooks/orb
 *
 * Handles Orb billing_period_ended webhook → auto-generates a MapAble invoice.
 * Ported from REPL POST /api/webhooks/orb.
 *
 * Orb sends HMAC-signed payloads. The verifyAndUnwrapOrbWebhook call will
 * throw if the signature is invalid.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAndUnwrapOrbWebhook, orbEnabled } from "@/lib/orb/client";

export const runtime = "nodejs"; // needs crypto

export async function POST(req: NextRequest) {
  if (!orbEnabled()) {
    return NextResponse.json({ error: "Orb not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const headers: Record<string, string | string[] | undefined> = {};
  req.headers.forEach((value, key) => { headers[key] = value; });

  let event: Record<string, unknown>;
  try {
    event = verifyAndUnwrapOrbWebhook(rawBody, headers);
  } catch (e) {
    console.error("[orb-webhook] Signature verification failed:", e);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type !== "billing_period_ended") {
    return NextResponse.json({ received: true, handled: false });
  }

  const subscription = event.subscription as { external_customer_id?: string; current_billing_period_start_date?: string; current_billing_period_end_date?: string } | undefined;
  const externalCustomerId = subscription?.external_customer_id;
  if (!externalCustomerId) {
    return NextResponse.json({ received: true, handled: false, reason: "no external_customer_id" });
  }

  const user = await prisma.user.findUnique({
    where: { id: externalCustomerId },
    select: { id: true, name: true },
  });
  if (!user) {
    console.warn(`[orb-webhook] No user found for external_customer_id=${externalCustomerId}`);
    return NextResponse.json({ received: true, handled: false, reason: "user not found" });
  }

  // Auto-generate a draft invoice covering the billing period.
  // Adapt the invoice model to match mapableau-new's BillingInvoice schema.
  const periodStart = subscription?.current_billing_period_start_date ?? new Date().toISOString().slice(0, 10);
  const periodEnd = subscription?.current_billing_period_end_date ?? new Date().toISOString().slice(0, 10);

  await prisma.invoice.create({
    data: {
      participantId: user.id,
      status: "draft",
      periodStart,
      periodEnd,
      totalAmount: 0,
      orbGenerated: true,
      lineItems: [],
    },
  });

  console.log(`[orb-webhook] Draft invoice created for user=${user.id} period=${periodStart}→${periodEnd}`);
  return NextResponse.json({ received: true, handled: true });
}
