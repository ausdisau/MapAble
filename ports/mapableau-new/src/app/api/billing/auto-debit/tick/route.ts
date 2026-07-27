/**
 * POST /api/billing/auto-debit/tick
 *
 * Runs one auto-debit scheduler tick. Should be called from a Vercel Cron
 * job (e.g. every 4 hours) rather than invoked directly by users.
 *
 * Cron config in vercel.json:
 *   { "crons": [{ "path": "/api/billing/auto-debit/tick", "schedule": "0 */4 * * *" }] }
 *
 * Ported from REPL server/auto-debit.ts + cron setup.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Stripe from "stripe";
import { runAutoDebitTick } from "@/lib/billing/auto-debit";
import { sendEmailViaAgentMail } from "@/lib/email/agentmail";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel Pro: up to 300s

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Authorize via CRON_SECRET set as Vercel environment variable
function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // development — no secret required
  return auth === `Bearer ${cronSecret}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runAutoDebitTick({
    prisma: prisma as any,
    stripe,

    sendEmail: async (to, subject, body) => {
      await sendEmailViaAgentMail(to, subject, body);
    },

    sendSms: async (to, message) => {
      // Wire to mapableau-new's Twilio SMS service:
      // import { sendSms } from "@/lib/notifications/twilio";
      // await sendSms(to, message);
      console.log(`[auto-debit] SMS (not wired): ${to}: ${message}`);
    },

    getCandidateInvoices: async () => {
      return prisma.invoice.findMany({
        where: {
          status: { in: ["submitted", "pending"] },
          stripePaymentIntentId: null,
          participant: {
            autoDebitEnabled: true,
            defaultBecsPaymentMethodId: { not: null },
            stripeCustomerId: { not: null },
          },
        },
        include: {
          participant: {
            select: {
              id: true, email: true, phoneNumber: true, fullName: true,
              stripeCustomerId: true, autoDebitEnabled: true,
              defaultBecsPaymentMethodId: true, autoDebitGraceDays: true,
              stripeAccountId: true, stripeChargesEnabled: true,
            },
          },
        },
      }).then((invoices: any[]) =>
        invoices.map((inv: any) => ({
          ...inv,
          user: inv.participant,
        })),
      );
    },

    getBecsMandateByPaymentMethod: async (pmId: string) => {
      return prisma.becsMandate.findFirst({
        where: { stripePaymentMethodId: pmId },
      }) as any;
    },

    getProviderById: async (id: string) => {
      return prisma.user.findUnique({
        where: { id },
        select: { stripeAccountId: true, stripeChargesEnabled: true },
      });
    },

    connectEnabled: process.env.STRIPE_CONNECT_ENABLED === "1",
    platformFeeBps: Number(process.env.STRIPE_PLATFORM_FEE_BPS ?? "500"),
  });

  return NextResponse.json(result);
}
