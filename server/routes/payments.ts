import type { Express } from "express";
import { storage } from "../storage";
import { getStripe, stripeEnabled, becsEnabled, connectEnabled, getStripeCapabilities, calculatePlatformFee, getPlatformFeeBps } from "../stripe";
import { getProdaIntegrationStatus, getRecentClaims, fetchPriceGuide, prodaConfigured, missingProdaEnv } from "../ndis-api";
import { orbEnabled, getCustomerUsage, verifyAndUnwrapWebhook } from "../orb";
import { qbEnabled, pushInvoiceToQb } from "../quickbooks";
import { requireAuth, provisionOrbBilling } from "./shared";

export function registerPaymentRoutes(app: Express) {
  app.get("/api/stripe/config", (_req, res) => {
    res.json(getStripeCapabilities());
  });

  app.post("/api/payments/create-intent", requireAuth, async (req, res) => {
    if (!stripeEnabled()) {
      return res.status(503).json({ message: "Stripe is not configured" });
    }
    const { invoiceId } = req.body;
    if (!invoiceId) return res.status(400).json({ message: "invoiceId required" });

    const invoice = await storage.getInvoiceById(invoiceId);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.participantId !== req.session.userId) {
      return res.status(403).json({ message: "Not authorized to pay this invoice" });
    }
    if (invoice.status === "paid") return res.status(400).json({ message: "Invoice already paid" });

    const lineItems = (invoice.lineItems as any[]) || [];
    const unverifiedItems = lineItems.filter((item: any) => item.abnVerified === false);
    if (unverifiedItems.length > 0) {
      return res.status(400).json({
        message: "This invoice contains line items from workers/providers with unverified ABNs. All ABNs must be verified before payment can be processed.",
        unverifiedCount: unverifiedItems.length,
        requiresAbnVerification: true,
      });
    }

    if (invoice.status === "pending" || invoice.status === "processing") {
      if (invoice.stripePaymentIntentId) {
        const existingPi = await getStripe().paymentIntents.retrieve(invoice.stripePaymentIntentId);
        if (existingPi.status !== "canceled" && existingPi.status !== "succeeded") {
          return res.json({ clientSecret: existingPi.client_secret, paymentIntentId: existingPi.id });
        }
      }
    }

    const user = await storage.getUser(invoice.participantId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await getStripe().customers.create({
        name: user.fullName,
        email: user.email,
        metadata: { userId: user.id, ndisNumber: user.ndisNumber || "" },
      });
      stripeCustomerId = customer.id;
      await storage.updateUserStripeCustomerId(user.id, stripeCustomerId);
    }

    const amountCents = Math.round(Number(invoice.totalAmount) * 100);
    const includeBecs = becsEnabled() && req.body.includeBecs !== false;
    const paymentMethodTypes: string[] = ["link", "card"];
    if (includeBecs) paymentMethodTypes.push("au_becs_debit");

    let connectTransferData: { destination: string } | undefined;
    let applicationFeeAmount: number | undefined;
    if (connectEnabled() && invoice.providerId) {
      const provider = await storage.getUser(invoice.providerId);
      if (provider?.stripeAccountId && provider.stripeChargesEnabled) {
        connectTransferData = { destination: provider.stripeAccountId };
        applicationFeeAmount = calculatePlatformFee(amountCents);
      }
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: amountCents,
      currency: "aud",
      customer: stripeCustomerId,
      payment_method_types: paymentMethodTypes,
      ...(connectTransferData ? { transfer_data: connectTransferData } : {}),
      ...(applicationFeeAmount ? { application_fee_amount: applicationFeeAmount } : {}),
      metadata: {
        invoiceId: invoice.id,
        participantId: invoice.participantId,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        ...(applicationFeeAmount ? { platformFeeCents: String(applicationFeeAmount) } : {}),
      },
    });

    await storage.updateInvoicePayment(invoice.id, {
      stripePaymentIntentId: paymentIntent.id,
      stripePaymentStatus: paymentIntent.status,
      status: "pending",
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  });

  app.post("/api/webhooks/stripe", async (req, res) => {
    if (!stripeEnabled()) return res.status(503).send();

    const sig = req.headers["stripe-signature"] as string;
    let event;

    try {
      event = getStripe().webhooks.constructEvent(
        req.rawBody as Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Stripe webhook signature verification failed:", message);
      return res.status(400).send(`Webhook Error: ${message}`);
    }

    const claimed = await storage.claimWebhookEvent(event.id, event.type);
    if (!claimed) {
      return res.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const invoiceId = pi.metadata?.invoiceId;
        const groceryOrderId = pi.metadata?.groceryOrderId;
        if (invoiceId) {
          await storage.updateInvoicePayment(invoiceId, {
            stripePaymentStatus: "succeeded",
            status: "paid",
          });
          const inv = await storage.getInvoiceById(invoiceId);
          if (inv) {
            const payer = await storage.getUser(inv.participantId);
            if (payer?.email) {
              const dollars = (Number(inv.totalAmount) || 0).toFixed(2);
              try {
                const { sendEmailViaAgentMail, sendSmsViaTwilio } = await import("../notifications");
                await sendEmailViaAgentMail(
                  payer.email,
                  `Payment received — invoice ${inv.id}`,
                  `Hi ${payer.fullName || "there"},\n\nWe've received your payment of $${dollars} for invoice ${inv.id}. Thank you!\n\n— MapAble`,
                );
                if (payer.phoneNumber) {
                  await sendSmsViaTwilio(payer.phoneNumber, `MapAble: payment of $${dollars} for invoice ${inv.id} received.`);
                }
              } catch (e) {
                console.error("[webhook] payment success notify failed:", e instanceof Error ? e.message : e);
              }
            }
            if (inv.qbInvoiceId && qbEnabled()) {
              pushInvoiceToQb(inv.participantId, invoiceId).catch((e) =>
                console.error("QB re-sync after Stripe payment failed:", e)
              );
            }
          }
        }
        if (groceryOrderId) {
          await storage.updateGroceryOrderPayment(groceryOrderId, { paymentStatus: "succeeded" });
          await storage.updateGroceryOrderStatus(groceryOrderId, "confirmed");
        }
        break;
      }
      case "payment_intent.processing": {
        const pi = event.data.object;
        const invoiceId = pi.metadata?.invoiceId;
        const groceryOrderId = pi.metadata?.groceryOrderId;
        if (invoiceId) {
          await storage.updateInvoicePayment(invoiceId, {
            stripePaymentStatus: "processing",
            status: "processing",
          });
        }
        if (groceryOrderId) {
          await storage.updateGroceryOrderPayment(groceryOrderId, { paymentStatus: "processing" });
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const invoiceId = pi.metadata?.invoiceId;
        const groceryOrderId = pi.metadata?.groceryOrderId;
        if (invoiceId) {
          await storage.updateInvoicePayment(invoiceId, {
            stripePaymentStatus: "failed",
            status: "failed",
          });
        }
        if (groceryOrderId) {
          await storage.updateGroceryOrderPayment(groceryOrderId, { paymentStatus: "failed" });
        }
        break;
      }
      case "setup_intent.succeeded": {
        const si = event.data.object as import("stripe").Stripe.SetupIntent;
        const pmId = typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id;
        if (pmId) {
          try {
            const pm = await getStripe().paymentMethods.retrieve(pmId);
            if (pm.type === "au_becs_debit" && pm.au_becs_debit) {
              const userId = (si.metadata?.userId as string | undefined) || (pm.metadata?.userId as string | undefined);
              if (userId) {
                const mandateId = typeof si.mandate === "string" ? si.mandate : si.mandate?.id ?? null;
                const existing = await storage.getBecsMandateByPaymentMethod(pmId);
                if (!existing) {
                  await storage.createBecsMandate({
                    userId,
                    stripePaymentMethodId: pmId,
                    stripeMandateId: mandateId,
                    bsbLast4: pm.au_becs_debit.bsb_number?.slice(-4) || null,
                    accountLast4: pm.au_becs_debit.last4 || null,
                    bankName: null,
                    status: "pending",
                    mandateUrl: null,
                    isDefault: false,
                  });
                } else {
                  await storage.updateBecsMandateStatus(pmId, existing.status === "active" ? "active" : "pending", undefined, mandateId ?? undefined);
                }
              }
            }
          } catch (e) {
            console.error("setup_intent.succeeded handler error:", e);
          }
        }
        break;
      }
      case "mandate.updated": {
        const mandate = event.data.object as import("stripe").Stripe.Mandate;
        const pmId = typeof mandate.payment_method === "string" ? mandate.payment_method : mandate.payment_method?.id;
        const status = mandate.status === "active" ? "active" : mandate.status === "inactive" ? "revoked" : "pending";
        if (pmId) {
          await storage.updateBecsMandateStatus(pmId, status);
        }
        break;
      }
      case "account.updated": {
        const acct = event.data.object as import("stripe").Stripe.Account;
        const user = await storage.getUserByStripeAccountId(acct.id);
        if (user) {
          await storage.setStripeAccount(user.id, {
            stripeAccountStatus: acct.charges_enabled && acct.payouts_enabled ? "active" : "pending",
            stripeChargesEnabled: !!acct.charges_enabled,
            stripePayoutsEnabled: !!acct.payouts_enabled,
            stripeRequirementsDue: acct.requirements ?? null,
          });
        }
        break;
      }
      case "transfer.created":
      case "payout.paid":
      case "payout.failed": {
        const obj = event.data.object as { id: string };
        console.log(`Stripe Connect event ${event.type}:`, obj.id);
        break;
      }
    }

    res.json({ received: true });
  });

  // ============================================================
  // BECS Direct Debit — payment methods & mandates
  // ============================================================
  app.get("/api/payment-methods", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const mandates = await storage.getBecsMandates(userId);
    const user = await storage.getUser(userId);
    res.json({
      becsMandates: mandates,
      autoDebitEnabled: user?.autoDebitEnabled ?? false,
      autoDebitGraceDays: user?.autoDebitGraceDays ?? 3,
      defaultBecsPaymentMethodId: user?.defaultBecsPaymentMethodId ?? null,
    });
  });

  app.post("/api/payment-methods/setup-intent", requireAuth, async (req, res) => {
    if (!becsEnabled()) return res.status(503).json({ message: "BECS Direct Debit is not enabled" });
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await getStripe().customers.create({
        name: user.fullName,
        email: user.email,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await storage.updateUserStripeCustomerId(user.id, stripeCustomerId);
    }

    const setupIntent = await getStripe().setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ["au_becs_debit"],
      usage: "off_session",
      metadata: { userId: user.id },
    });
    res.json({ clientSecret: setupIntent.client_secret, setupIntentId: setupIntent.id });
  });

  app.post("/api/payment-methods/:id/default", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const m = await storage.setDefaultBecsMandate(userId, req.params.id as string);
    if (!m) return res.status(404).json({ message: "Mandate not found" });
    res.json(m);
  });

  app.delete("/api/payment-methods/:id", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const m = await storage.getBecsMandate(req.params.id as string);
    if (!m || m.userId !== userId) return res.status(404).json({ message: "Mandate not found" });
    try {
      await getStripe().paymentMethods.detach(m.stripePaymentMethodId);
    } catch (e) {
      console.error("Stripe detach failed (continuing):", e);
    }
    await storage.deleteBecsMandate(m.id);
    res.status(204).send();
  });

  app.put("/api/billing/auto-debit", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const { enabled, graceDays } = req.body;
    if (typeof enabled !== "boolean") return res.status(400).json({ message: "enabled (boolean) required" });
    if (enabled) {
      const def = await storage.getDefaultBecsMandate(userId);
      if (!def) return res.status(400).json({ message: "Set a default BECS payment method before enabling auto-debit" });
    }
    const u = await storage.setUserAutoDebit(userId, enabled, typeof graceDays === "number" ? graceDays : undefined);
    res.json({ autoDebitEnabled: u?.autoDebitEnabled, autoDebitGraceDays: u?.autoDebitGraceDays });
  });

  // ============================================================
  // Stripe Connect — provider payouts
  // ============================================================
  app.get("/api/payouts/account", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      connectEnabled: connectEnabled(),
      stripeAccountId: user.stripeAccountId,
      stripeAccountStatus: user.stripeAccountStatus,
      stripeChargesEnabled: user.stripeChargesEnabled,
      stripePayoutsEnabled: user.stripePayoutsEnabled,
      stripeRequirementsDue: user.stripeRequirementsDue,
      platformFeeBps: getPlatformFeeBps(),
    });
  });

  app.post("/api/payouts/onboard", requireAuth, async (req, res) => {
    if (!connectEnabled()) return res.status(503).json({ message: "Stripe Connect is not enabled" });
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "carer" && user.role !== "provider") {
      return res.status(403).json({ message: "Only workers/providers can onboard for payouts" });
    }
    if (user.role === "carer") {
      const worker = await storage.getWorkerByUserId(user.id);
      if (!worker?.abnVerified) {
        return res.status(400).json({ message: "ABN must be verified before payout onboarding" });
      }
    } else {
      // provider role: ABN must be verified before onboarding
      if (!user.abn || !user.abnVerified) {
        return res.status(400).json({ message: "Provider ABN must be verified before payout onboarding" });
      }
    }

    let accountId = user.stripeAccountId;
    if (!accountId) {
      const account = await getStripe().accounts.create({
        type: "express",
        country: "AU",
        email: user.email,
        capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
        business_profile: { name: user.fullName },
        metadata: { userId: user.id },
      });
      accountId = account.id;
      await storage.setStripeAccount(user.id, {
        stripeAccountId: accountId,
        stripeAccountStatus: "pending",
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
      });
    }

    const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;
    const link = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/payouts?refresh=1`,
      return_url: `${origin}/payouts?onboarded=1`,
      type: "account_onboarding",
    });
    res.json({ url: link.url, accountId });
  });

  app.post("/api/payouts/sync", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.stripeAccountId) return res.status(400).json({ message: "No connected Stripe account" });
    const acct = await getStripe().accounts.retrieve(user.stripeAccountId);
    const updated = await storage.setStripeAccount(user.id, {
      stripeAccountStatus: acct.charges_enabled && acct.payouts_enabled ? "active" : "pending",
      stripeChargesEnabled: !!acct.charges_enabled,
      stripePayoutsEnabled: !!acct.payouts_enabled,
      stripeRequirementsDue: acct.requirements ?? null,
    });
    res.json(updated);
  });

  app.get("/api/payouts/history", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.stripeAccountId) {
      return res.json({ transfers: [], payouts: [] });
    }
    try {
      const limit = Math.min(Number(req.query.limit) || 25, 100);
      const [transfers, payouts] = await Promise.all([
        getStripe().transfers.list({ destination: user.stripeAccountId, limit }),
        getStripe().payouts.list({ limit }, { stripeAccount: user.stripeAccountId }),
      ]);
      res.json({
        transfers: transfers.data.map((t) => ({
          id: t.id,
          amount: t.amount,
          currency: t.currency,
          created: t.created,
          description: t.description,
          sourceTransaction: typeof t.source_transaction === "string" ? t.source_transaction : t.source_transaction?.id ?? null,
        })),
        payouts: payouts.data.map((p) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          arrivalDate: p.arrival_date,
          created: p.created,
          method: p.method,
          failureMessage: p.failure_message ?? null,
        })),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch payout history";
      console.error("[payouts/history]", msg);
      res.status(500).json({ message: msg });
    }
  });

  // ============================================================
  // NDIS admin endpoints
  // ============================================================
  app.get("/api/ndis/integration-status", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || (user.role !== "admin" && user.role !== "provider")) {
      return res.status(403).json({ message: "Admin or provider access required" });
    }
    res.json(getProdaIntegrationStatus());
  });

  app.post("/api/ndis/price-guide/sync", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || (user.role !== "admin" && user.role !== "provider")) {
      return res.status(403).json({ message: "Admin or provider access required" });
    }
    if (!prodaConfigured()) {
      return res.status(503).json({
        message: "PRODA is not configured",
        missingEnvVars: missingProdaEnv(),
      });
    }
    try {
      const items = await fetchPriceGuide();
      res.json({ ok: true, itemsCount: items.length, syncedAt: new Date().toISOString() });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("Price guide sync failed:", msg);
      res.status(502).json({ message: "Price guide sync failed", error: msg });
    }
  });

  app.get("/api/ndis/claims", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "User not found" });
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    if (user.role === "admin") {
      const claims = await getRecentClaims(limit);
      return res.json(claims);
    }
    if (user.role === "provider") {
      const claims = await storage.getNdisClaims({ providerId: user.id, limit });
      return res.json(claims);
    }
    const claims = await storage.getNdisClaims({ participantId: user.id, limit });
    res.json(claims);
  });

  app.post("/api/webhooks/orb", async (req, res) => {
    if (!orbEnabled()) {
      return res.status(503).json({ message: "Orb not configured" });
    }

    let event: Record<string, unknown>;
    try {
      const rawBody = typeof req.rawBody === "string" ? req.rawBody : (req.rawBody as Buffer).toString("utf8");
      event = verifyAndUnwrapWebhook(rawBody, req.headers as Record<string, string | string[] | undefined>);
    } catch (e) {
      console.error("Orb webhook verification failed:", e);
      return res.status(401).json({ message: "Invalid Orb webhook signature" });
    }
    const eventData = event.data as Record<string, unknown> | undefined;
    const eventCustomer = (eventData?.customer as Record<string, unknown>) || {};

    if (event.type === "subscription.billing_period_ended") {
      const customerId = eventCustomer.external_customer_id as string | undefined;
      if (customerId) {
        const periodStart = eventData?.billing_period_start as string | undefined;
        const periodEnd = eventData?.billing_period_end as string | undefined;
        if (periodStart && periodEnd) {
          try {
            await storage.generateInvoice(customerId, periodStart, periodEnd);
          } catch (e) {
            console.error("Orb webhook invoice generation failed:", e);
          }
        }
      }
    } else if (event.type === "invoice.issued") {
      const externalCustomerId = eventCustomer.external_customer_id as string | undefined;
      const orbInvoiceTotal = eventData?.total;
      if (externalCustomerId) {
        console.log(`Orb invoice issued for customer ${externalCustomerId}, total: ${orbInvoiceTotal}`);
      }
    }
    res.json({ received: true });
  });

  app.post("/api/billing/setup-orb", requireAuth, async (req, res) => {
    if (!orbEnabled()) return res.status(503).json({ message: "Orb is not configured" });

    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "participant") return res.status(403).json({ message: "Only participants can set up billing" });

    if (user.orbCustomerId) {
      return res.json({ orbCustomerId: user.orbCustomerId, orbSubscriptionId: user.orbSubscriptionId });
    }

    await provisionOrbBilling(user);

    const updatedUser = await storage.getUser(user.id);
    if (!updatedUser?.orbCustomerId) {
      return res.status(500).json({ message: "Failed to set up Orb billing" });
    }
    res.json({ orbCustomerId: updatedUser.orbCustomerId, orbSubscriptionId: updatedUser.orbSubscriptionId });
  });

  app.get("/api/billing/usage", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.orbCustomerId || !orbEnabled()) {
      return res.json({ usage: null, orbEnabled: orbEnabled() });
    }

    try {
      const usageData = await getCustomerUsage(user.orbCustomerId);
      res.json({ usage: usageData, orbEnabled: true });
    } catch (e) {
      console.error("Failed to fetch Orb usage:", e);
      res.json({ usage: null, orbEnabled: true });
    }
  });
}
