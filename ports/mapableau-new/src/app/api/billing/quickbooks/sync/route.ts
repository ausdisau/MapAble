/**
 * POST /api/billing/quickbooks/sync  — manually sync all QB invoices
 * Ported from REPL POST /api/quickbooks/sync.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { qbEnabled } from "@/lib/billing/quickbooks/client";
import { pushInvoiceToQb, pullPaymentsFromQb } from "@/lib/billing/quickbooks/sync";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!qbEnabled()) return NextResponse.json({ error: "QB not configured" }, { status: 503 });

  const getUser = async (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true, fullName: true, email: true, ndisNumber: true,
        qbAccessToken: true, qbRefreshToken: true, qbRealmId: true, qbTokenExpiresAt: true,
      },
    }) as any;

  const getPendingInvoices = async (userId: string) =>
    prisma.invoice.findMany({
      where: { participantId: userId, status: { not: "paid" } },
    }) as any;

  const invoices = await prisma.invoice.findMany({
    where: {
      participantId: session.user.id,
      OR: [
        { qbInvoiceId: null },
        { qbSyncStatus: { in: ["error", "pending"] } },
      ],
    },
  });

  let pushed = 0;
  const errors: string[] = [];
  for (const inv of invoices) {
    try {
      await pushInvoiceToQb(prisma as any, session.user.id, inv.id, getUser, async (id) =>
        prisma.invoice.findUnique({ where: { id } }) as any,
      );
      pushed++;
    } catch (e) {
      errors.push(`Push failed for invoice ${inv.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const { updated: paymentUpdates, errors: paymentErrors } =
    await pullPaymentsFromQb(prisma as any, session.user.id, getUser, getPendingInvoices);

  return NextResponse.json({ pushed, paymentUpdates, errors: [...errors, ...paymentErrors] });
}
