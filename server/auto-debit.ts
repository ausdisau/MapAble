import { storage } from "./storage";
import { getStripe, stripeEnabled, becsEnabled, calculatePlatformFee, connectEnabled } from "./stripe";
import { sendEmailViaAgentMail, sendSmsViaTwilio } from "./notifications";

async function notifyAutoDebit(
  email: string | null,
  phoneNumber: string | null,
  fullName: string | null,
  invoiceId: string,
  outcome: "attempt" | "success" | "failure",
  amountCents: number,
  reason?: string,
): Promise<void> {
  const dollars = (amountCents / 100).toFixed(2);
  const subject =
    outcome === "success" ? `Auto-debit successful — invoice ${invoiceId}`
    : outcome === "failure" ? `Auto-debit failed — invoice ${invoiceId}`
    : `Auto-debit attempt scheduled — invoice ${invoiceId}`;
  const body =
    outcome === "success"
      ? `We successfully debited $${dollars} from your default bank account for invoice ${invoiceId}. BECS settlements typically take 3–4 business days.`
      : outcome === "failure"
      ? `We could not debit $${dollars} from your default bank account for invoice ${invoiceId}.${reason ? ` Reason: ${reason}.` : ""} We'll retry on the next cycle.`
      : `We are about to debit $${dollars} from your default bank account for invoice ${invoiceId}.`;
  const emailLines = [
    `Hi ${fullName || "there"},`,
    "",
    body,
    "",
    "You can manage auto-debit and bank accounts in MapAble → Settings → Payment methods.",
    "",
    "— MapAble",
  ];
  try {
    if (email) await sendEmailViaAgentMail(email, subject, emailLines.join("\n"));
  } catch (e) {
    console.error("[auto-debit] email notify failed:", e instanceof Error ? e.message : e);
  }
  try {
    if (phoneNumber) await sendSmsViaTwilio(phoneNumber, `MapAble: ${body}`);
  } catch (e) {
    console.error("[auto-debit] sms notify failed:", e instanceof Error ? e.message : e);
  }
}

export async function runAutoDebitTick(): Promise<{ attempted: number; succeeded: number; failed: number; skipped: number }> {
  const result = { attempted: 0, succeeded: 0, failed: 0, skipped: 0 };
  if (!stripeEnabled() || !becsEnabled()) return result;

  const candidates = await storage.getInvoicesAwaitingAutoDebit();
  const now = Date.now();

  for (const inv of candidates) {
    const user = inv.user;
    if (!user || !user.autoDebitEnabled || !user.defaultBecsPaymentMethodId || !user.stripeCustomerId) {
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

    const mandate = await storage.getBecsMandateByPaymentMethod(user.defaultBecsPaymentMethodId);
    if (!mandate || mandate.status !== "active") {
      result.skipped++;
      continue;
    }

    const amountCents = Math.round(Number(inv.totalAmount) * 100);
    if (amountCents <= 0) {
      result.skipped++;
      continue;
    }

    let connectExtras: Record<string, unknown> = {};
    if (connectEnabled() && inv.providerId) {
      const provider = await storage.getUser(inv.providerId);
      if (provider?.stripeAccountId && provider.stripeChargesEnabled) {
        connectExtras = {
          transfer_data: { destination: provider.stripeAccountId },
          application_fee_amount: calculatePlatformFee(amountCents),
        };
      }
    }

    result.attempted++;
    void notifyAutoDebit(user.email, user.phoneNumber, user.fullName, inv.id, "attempt", amountCents);
    try {
      const pi = await getStripe().paymentIntents.create({
        amount: amountCents,
        currency: "aud",
        customer: user.stripeCustomerId,
        payment_method: user.defaultBecsPaymentMethodId,
        payment_method_types: ["au_becs_debit"],
        mandate: mandate.stripeMandateId || undefined,
        confirm: true,
        off_session: true,
        metadata: {
          invoiceId: inv.id,
          participantId: inv.participantId,
          autoDebit: "true",
        },
        ...connectExtras,
      });
      await storage.updateInvoicePayment(inv.id, {
        stripePaymentIntentId: pi.id,
        stripePaymentStatus: pi.status,
        status: pi.status === "succeeded" ? "paid" : "processing",
      });
      result.succeeded++;
      console.log(`[auto-debit] invoice=${inv.id} pi=${pi.id} status=${pi.status}`);
      if (pi.status === "succeeded" || pi.status === "processing") {
        void notifyAutoDebit(user.email, user.phoneNumber, user.fullName, inv.id, "success", amountCents);
      }
    } catch (e) {
      result.failed++;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[auto-debit] invoice=${inv.id} failed:`, msg);
      await storage.updateInvoicePayment(inv.id, {
        stripePaymentStatus: "failed",
      });
      void notifyAutoDebit(user.email, user.phoneNumber, user.fullName, inv.id, "failure", amountCents, msg);
    }
  }

  if (result.attempted > 0) {
    console.log(`[auto-debit] tick: attempted=${result.attempted} succeeded=${result.succeeded} failed=${result.failed} skipped=${result.skipped}`);
  }
  return result;
}
