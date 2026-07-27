/**
 * BECS direct-debit auto-debit scheduler for mapableau-new.
 *
 * Ported from REPL server/auto-debit.ts. Drives AU BECS Direct Debit charges
 * via Stripe for invoices that are past their grace period and have an active
 * BECS mandate.
 *
 * Required environment variables:
 *   STRIPE_SECRET_KEY         — Stripe secret API key
 *   STRIPE_CONNECT_ENABLED    — set to "1" to enable platform fee transfers
 *   STRIPE_PLATFORM_FEE_BPS   — platform fee basis points (default 500 = 5%)
 *   STRIPE_BECS_DISABLED      — set to "1" to disable BECS entirely
 *
 * Caller integration pattern:
 *   // In a Vercel Cron or API route handler:
 *   import { runAutoDebitTick } from "@/lib/billing/auto-debit";
 *   const result = await runAutoDebitTick({ prisma, stripe, sendEmail, sendSms });
 */

import type Stripe from "stripe";

// ---------------------------------------------------------------------------
// Interfaces the caller must supply (adapts to mapableau-new's schema)
// ---------------------------------------------------------------------------

export interface AutoDebitUser {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  fullName: string | null;
  stripeCustomerId: string | null;
  autoDebitEnabled: boolean;
  defaultBecsPaymentMethodId: string | null;
  autoDebitGraceDays: number | null;
  stripeAccountId?: string | null;       // provider Stripe Connect account
  stripeChargesEnabled?: boolean | null;
}

export interface AutoDebitInvoice {
  id: string;
  participantId: string;
  providerId?: string | null;
  totalAmount: string | number;
  generatedAt?: Date | null;
  stripePaymentIntentId?: string | null;
  status?: string;
  user?: AutoDebitUser | null; // joined participant record
}

export interface AutoDebitBecsMandate {
  id: string;
  stripePaymentMethodId: string;
  stripeMandateId?: string | null;
  status: "pending" | "active" | "cancelled" | "expired";
}

export interface AutoDebitPrismaLike {
  invoice: {
    update: (args: any) => Promise<any>;
  };
}

export interface AutoDebitDeps {
  prisma: AutoDebitPrismaLike;
  stripe: Stripe;
  /** Send email notification — should not throw */
  sendEmail: (to: string, subject: string, body: string) => Promise<void>;
  /** Send SMS notification — should not throw */
  sendSms?: (to: string, message: string) => Promise<void>;
  /** Return invoices ready for auto-debit (status=submitted, no pi yet, auto-debit on) */
  getCandidateInvoices: () => Promise<AutoDebitInvoice[]>;
  /** Return the active BECS mandate for a payment method id */
  getBecsMandateByPaymentMethod: (
    pmId: string,
  ) => Promise<AutoDebitBecsMandate | null>;
  /** Return provider by id (for Stripe Connect transfers) */
  getProviderById?: (id: string) => Promise<{
    stripeAccountId?: string | null;
    stripeChargesEnabled?: boolean | null;
  } | null>;
  platformFeeBps?: number;
  connectEnabled?: boolean;
}

// ---------------------------------------------------------------------------
// Internal notification helper
// ---------------------------------------------------------------------------

async function notifyAutoDebit(
  deps: AutoDebitDeps,
  user: AutoDebitUser,
  invoiceId: string,
  outcome: "attempt" | "success" | "failure",
  amountCents: number,
  reason?: string,
): Promise<void> {
  const dollars = (amountCents / 100).toFixed(2);
  const subject =
    outcome === "success"
      ? `Auto-debit successful — invoice ${invoiceId}`
      : outcome === "failure"
        ? `Auto-debit failed — invoice ${invoiceId}`
        : `Auto-debit attempt scheduled — invoice ${invoiceId}`;
  const body =
    outcome === "success"
      ? `We successfully debited $${dollars} from your default bank account for invoice ${invoiceId}. BECS settlements typically take 3–4 business days.`
      : outcome === "failure"
        ? `We could not debit $${dollars} from your default bank account for invoice ${invoiceId}.${reason ? ` Reason: ${reason}.` : ""} We'll retry on the next cycle.`
        : `We are about to debit $${dollars} from your default bank account for invoice ${invoiceId}.`;
  const lines = [
    `Hi ${user.fullName || "there"},`,
    "",
    body,
    "",
    "You can manage auto-debit and bank accounts in MapAble → Settings → Payment methods.",
    "",
    "— MapAble",
  ];
  try {
    if (user.email) await deps.sendEmail(user.email, subject, lines.join("\n"));
  } catch (e) {
    console.error("[auto-debit] email notify failed:", e instanceof Error ? e.message : e);
  }
  try {
    if (user.phoneNumber && deps.sendSms) {
      await deps.sendSms(user.phoneNumber, `MapAble: ${body}`);
    }
  } catch (e) {
    console.error("[auto-debit] sms notify failed:", e instanceof Error ? e.message : e);
  }
}

// ---------------------------------------------------------------------------
// Main tick function (call from Vercel Cron route)
// ---------------------------------------------------------------------------

export async function runAutoDebitTick(
  deps: AutoDebitDeps,
): Promise<{ attempted: number; succeeded: number; failed: number; skipped: number }> {
  const result = { attempted: 0, succeeded: 0, failed: 0, skipped: 0 };

  // Guard: BECS disabled
  if (process.env.STRIPE_BECS_DISABLED === "1") return result;

  const candidates = await deps.getCandidateInvoices();
  const now = Date.now();
  const platformFeeBps = deps.platformFeeBps ?? Number(process.env.STRIPE_PLATFORM_FEE_BPS || "500");
  const connectEnabled =
    deps.connectEnabled ?? process.env.STRIPE_CONNECT_ENABLED === "1";

  for (const inv of candidates) {
    const user = inv.user;
    if (
      !user ||
      !user.autoDebitEnabled ||
      !user.defaultBecsPaymentMethodId ||
      !user.stripeCustomerId
    ) {
      result.skipped++;
      continue;
    }

    const issuedAt = inv.generatedAt ? new Date(inv.generatedAt).getTime() : now;
    const graceMs = (user.autoDebitGraceDays ?? 2) * 24 * 60 * 60 * 1000;
    if (now - issuedAt < graceMs) {
      result.skipped++;
      continue;
    }
    if (inv.stripePaymentIntentId) {
      result.skipped++;
      continue;
    }

    const mandate = await deps.getBecsMandateByPaymentMethod(
      user.defaultBecsPaymentMethodId,
    );
    if (!mandate || mandate.status !== "active") {
      result.skipped++;
      continue;
    }

    const amountCents = Math.round(Number(inv.totalAmount) * 100);
    if (amountCents <= 0) {
      result.skipped++;
      continue;
    }

    // Build optional Stripe Connect extras
    let connectExtras: Record<string, unknown> = {};
    if (connectEnabled && inv.providerId && deps.getProviderById) {
      const provider = await deps.getProviderById(inv.providerId);
      if (provider?.stripeAccountId && provider.stripeChargesEnabled) {
        const fee = Math.round((amountCents * platformFeeBps) / 10000);
        connectExtras = {
          transfer_data: { destination: provider.stripeAccountId },
          application_fee_amount: fee,
        };
      }
    }

    result.attempted++;
    void notifyAutoDebit(deps, user, inv.id, "attempt", amountCents);

    try {
      const pi = await deps.stripe.paymentIntents.create({
        amount: amountCents,
        currency: "aud",
        customer: user.stripeCustomerId,
        payment_method: user.defaultBecsPaymentMethodId,
        payment_method_types: ["au_becs_debit"],
        ...(mandate.stripeMandateId ? { mandate: mandate.stripeMandateId } : {}),
        confirm: true,
        off_session: true,
        metadata: {
          invoiceId: inv.id,
          participantId: inv.participantId,
          autoDebit: "true",
        },
        ...connectExtras,
      } as Stripe.PaymentIntentCreateParams);

      await deps.prisma.invoice.update({
        where: { id: inv.id },
        data: {
          stripePaymentIntentId: pi.id,
          stripePaymentStatus: pi.status,
          status: pi.status === "succeeded" ? "paid" : "processing",
        },
      });

      result.succeeded++;
      console.log(`[auto-debit] invoice=${inv.id} pi=${pi.id} status=${pi.status}`);
      if (pi.status === "succeeded") {
        void notifyAutoDebit(deps, user, inv.id, "success", amountCents);
      }
    } catch (e) {
      result.failed++;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[auto-debit] invoice=${inv.id} failed:`, msg);
      await deps.prisma.invoice.update({
        where: { id: inv.id },
        data: { stripePaymentStatus: "failed" },
      });
      void notifyAutoDebit(deps, user, inv.id, "failure", amountCents, msg);
    }
  }

  if (result.attempted > 0) {
    console.log(
      `[auto-debit] tick: attempted=${result.attempted} succeeded=${result.succeeded} failed=${result.failed} skipped=${result.skipped}`,
    );
  }
  return result;
}
