/**
 * GET  /api/billing/becs/mandate   — list BECS mandates for the current user
 * POST /api/billing/becs/mandate   — record a new mandate from Stripe SetupIntent
 * PATCH /api/billing/becs/mandate  — update mandate status (webhook-driven)
 *
 * Ported from REPL BECS mandate routes.
 *
 * Stripe BECS webhook events to handle alongside this:
 *   setup_intent.succeeded      → create/activate mandate record
 *   mandate.updated             → update status field
 *   payment_intent.succeeded    → update invoice status to paid
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const mandates = await prisma.becsMandate.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(mandates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { stripePaymentMethodId, stripeMandateId, accountBsb, accountLast4 } = await req.json();
  if (!stripePaymentMethodId) {
    return NextResponse.json({ error: "stripePaymentMethodId is required" }, { status: 400 });
  }

  const mandate = await prisma.becsMandate.upsert({
    where: { stripePaymentMethodId },
    create: {
      userId: session.user.id,
      stripePaymentMethodId,
      stripeMandateId: stripeMandateId ?? null,
      status: "pending",
      accountBsb: accountBsb ?? null,
      accountLast4: accountLast4 ?? null,
    },
    update: {
      stripeMandateId: stripeMandateId ?? undefined,
      status: "pending",
    },
  });

  // Set as default BECS payment method on the user
  await prisma.user.update({
    where: { id: session.user.id },
    data: { defaultBecsPaymentMethodId: stripePaymentMethodId },
  });

  return NextResponse.json(mandate, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { stripePaymentMethodId, status } = await req.json();
  if (!stripePaymentMethodId || !status) {
    return NextResponse.json({ error: "stripePaymentMethodId and status are required" }, { status: 400 });
  }
  const validStatuses = ["pending", "active", "cancelled", "expired"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
  }

  const mandate = await prisma.becsMandate.update({
    where: { stripePaymentMethodId },
    data: { status },
  });
  return NextResponse.json(mandate);
}
