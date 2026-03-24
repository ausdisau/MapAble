import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import {
  insertBookingSchema,
  insertJobSchema,
  insertTransportRequestSchema,
  insertMessageSchema,
  insertServiceSessionSchema,
  insertTransportTripSchema,
  insertReviewSchema,
  insertCommunityReportSchema,
} from "@shared/schema";
import { z } from "zod";
import {
  processChat,
  createChatSession,
  getUserSessions,
  getSessionMessages,
  deleteChatSession,
} from "./chat-engine";
import { getStripe, stripeEnabled } from "./stripe";
import { orbEnabled, createOrbCustomer, createOrbSubscription, ingestCareHoursEvent, ingestTransportKmEvent, getCustomerUsage, verifyAndUnwrapWebhook } from "./orb";

const patchUserSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  email: z.string().email().max(200).optional(),
  location: z.string().max(200).optional(),
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  async function provisionOrbBilling(user: { id: string; fullName: string; email: string; orbCustomerId: string | null }) {
    if (user.orbCustomerId || !orbEnabled()) return;
    try {
      const orbCustomer = await createOrbCustomer(user.id, user.fullName, user.email);
      let orbSubId: string | null = null;
      try {
        const sub = await createOrbSubscription(orbCustomer.id);
        orbSubId = sub?.id || null;
      } catch (e) {
        console.error("Orb subscription creation failed:", e);
      }
      await storage.updateUserOrbIds(user.id, orbCustomer.id, orbSubId);
    } catch (e) {
      console.error("Orb customer provisioning failed:", e);
    }
  }

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    req.session.userId = user.id;

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  app.use("/api", (req, res, next) => {
    if (
      req.path === "/auth/login" ||
      req.path === "/auth/logout" ||
      req.path === "/auth/me" ||
      req.path === "/webhooks/stripe" ||
      req.path === "/webhooks/orb" ||
      req.path === "/stripe/config"
    ) {
      return next();
    }
    requireAuth(req, res, next);
  });

  registerObjectStorageRoutes(app);

  app.get("/api/me", async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "No user found" });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  app.patch("/api/me", async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "No user found" });
    const parsed = patchUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const { fullName, email, location } = parsed.data;
    const updated = await storage.updateUserProfile(user.id, { fullName, email, location });
    if (!updated) return res.status(500).json({ message: "Update failed" });
    const { password, ...safeUser } = updated;
    res.json(safeUser);
  });

  app.get("/api/workers", async (_req, res) => {
    const workers = await storage.getWorkers();
    res.json(workers);
  });

  app.get("/api/workers/:id", async (req, res) => {
    const worker = await storage.getWorker(req.params.id);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json(worker);
  });

  app.get("/api/bookings", async (_req, res) => {
    const bookings = await storage.getBookings();
    res.json(bookings);
  });

  app.post("/api/bookings", async (req, res) => {
    const parsed = insertBookingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const booking = await storage.createBooking(parsed.data);
    res.status(201).json(booking);
  });

  app.get("/api/jobs", async (_req, res) => {
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  app.get("/api/jobs/:id", async (req, res) => {
    const job = await storage.getJob(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  });

  app.post("/api/jobs", async (req, res) => {
    const parsed = insertJobSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const job = await storage.createJob(parsed.data);
    res.status(201).json(job);
  });

  app.get("/api/transport", async (_req, res) => {
    const requests = await storage.getTransportRequests();
    res.json(requests);
  });

  app.post("/api/transport", async (req, res) => {
    const parsed = insertTransportRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const request = await storage.createTransportRequest(parsed.data);
    res.status(201).json(request);
  });

  app.get("/api/messages", async (_req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    const parsed = insertMessageSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const message = await storage.createMessage(parsed.data);
    res.status(201).json(message);
  });

  app.patch("/api/workers/:id/photo", async (req, res) => {
    const { photo } = req.body;
    if (!photo) return res.status(400).json({ message: "photo path required" });
    const worker = await storage.updateWorkerPhoto(req.params.id, photo);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json(worker);
  });

  app.patch("/api/users/:id/avatar", async (req, res) => {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ message: "avatar path required" });
    const user = await storage.updateUserAvatar(req.params.id, avatar);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.get("/api/pricing/care", async (_req, res) => {
    const tiers = await storage.getPricingTiers("care");
    res.json(tiers);
  });

  app.get("/api/pricing/transport", async (_req, res) => {
    const tiers = await storage.getPricingTiers("transport");
    res.json(tiers);
  });

  app.get("/api/pricing/care/rate", async (req, res) => {
    const participantId = req.query.participantId as string;
    if (!participantId) return res.status(400).json({ message: "participantId required" });
    const now = new Date().toISOString();
    const result = await storage.calculateCareRate(participantId, now);
    res.json(result);
  });

  app.get("/api/pricing/transport/rate", async (req, res) => {
    const participantId = req.query.participantId as string;
    if (!participantId) return res.status(400).json({ message: "participantId required" });
    const now = new Date().toISOString();
    const result = await storage.calculateTransportRate(participantId, now);
    res.json(result);
  });

  app.post("/api/sessions", async (req, res) => {
    const parsed = insertServiceSessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

    const data = parsed.data;
    if (data.actualHours && !data.hourlyRate) {
      const rateInfo = await storage.calculateCareRate(data.participantId, data.date);
      data.hourlyRate = rateInfo.rate.toFixed(2);
      data.tierApplied = rateInfo.tier;
      data.totalCharge = (Number(data.actualHours) * rateInfo.rate).toFixed(2);
      data.ndisItemCode = data.ndisItemCode || "01_011_0107_1_1";
    }

    if (data.endTime && data.actualHours) {
      data.status = "completed";
    }

    const session = await storage.createServiceSession(data);

    if (session.totalCharge) {
      await storage.updateBudgetUsage(data.participantId, "daily_living", Number(session.totalCharge));
    }

    if (session.status === "completed" && orbEnabled()) {
      const participant = await storage.getUser(data.participantId);
      if (participant && !participant.orbCustomerId) {
        await provisionOrbBilling(participant);
      }
      try {
        await ingestCareHoursEvent(
          data.participantId,
          Number(session.actualHours || 0),
          session.tierApplied || "Standard",
          session.id,
        );
      } catch (e) {
        console.error("Orb usage ingest failed for session:", e);
      }
    }

    res.status(201).json(session);
  });

  app.get("/api/sessions", async (req, res) => {
    const participantId = req.query.participantId as string;
    if (!participantId) return res.status(400).json({ message: "participantId required" });
    const sessions = await storage.getServiceSessions(participantId);
    res.json(sessions);
  });

  app.post("/api/trips", async (req, res) => {
    const parsed = insertTransportTripSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

    const data = parsed.data;
    if (data.distanceKm && !data.perKmRate) {
      const rateInfo = await storage.calculateTransportRate(data.participantId, data.date);
      let kmRate = rateInfo.rate;

      if (data.accessibleVehicle) {
        kmRate = 2.76;
        data.tierApplied = "Accessible Vehicle";
        data.accessibleSurcharge = "0";
      } else {
        data.tierApplied = rateInfo.tier;
      }

      data.perKmRate = kmRate.toFixed(2);
      let charge = Number(data.distanceKm) * kmRate;
      charge += Number(data.tolls || 0);
      data.totalCharge = charge.toFixed(2);
      data.ndisItemCode = data.ndisItemCode || "02_051_0108_1_1";
    }

    if (data.distanceKm) {
      data.status = "completed";
    }

    const trip = await storage.createTransportTrip(data);

    if (trip.totalCharge) {
      await storage.updateBudgetUsage(data.participantId, "transport", Number(trip.totalCharge));
    }

    if (trip.status === "completed" && orbEnabled()) {
      const participant = await storage.getUser(data.participantId);
      if (participant && !participant.orbCustomerId) {
        await provisionOrbBilling(participant);
      }
      try {
        await ingestTransportKmEvent(
          data.participantId,
          Number(trip.distanceKm || 0),
          trip.tierApplied || "Standard",
          trip.id,
        );
      } catch (e) {
        console.error("Orb usage ingest failed for trip:", e);
      }
    }

    res.status(201).json(trip);
  });

  app.get("/api/trips", async (req, res) => {
    const participantId = req.query.participantId as string;
    if (!participantId) return res.status(400).json({ message: "participantId required" });
    const trips = await storage.getTransportTrips(participantId);
    res.json(trips);
  });

  app.post("/api/invoices/generate", async (req, res) => {
    const { participantId, periodStart, periodEnd } = req.body;
    if (!participantId || !periodStart || !periodEnd) {
      return res.status(400).json({ message: "participantId, periodStart, and periodEnd required" });
    }
    const invoice = await storage.generateInvoice(participantId, periodStart, periodEnd);
    res.status(201).json(invoice);
  });

  app.get("/api/invoices", async (req, res) => {
    const participantId = req.query.participantId as string;
    if (!participantId) return res.status(400).json({ message: "participantId required" });
    const invoiceList = await storage.getInvoices(participantId);
    res.json(invoiceList);
  });

  app.get("/api/budget", async (req, res) => {
    const participantId = req.query.participantId as string;
    if (!participantId) return res.status(400).json({ message: "participantId required" });
    const budgets = await storage.getParticipantBudgets(participantId);
    const careRate = await storage.calculateCareRate(participantId, new Date().toISOString());
    const transportRate = await storage.calculateTransportRate(participantId, new Date().toISOString());
    res.json({ budgets, currentCareTier: careRate, currentTransportTier: transportRate });
  });

  app.post("/api/reviews", async (req, res) => {
    const parsed = insertReviewSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const review = await storage.createReview(parsed.data);
    res.status(201).json(review);
  });

  app.get("/api/workers/:id/reviews", async (req, res) => {
    const workerReviews = await storage.getReviewsForWorker(req.params.id);
    res.json(workerReviews);
  });

  app.get("/api/access-profile", async (req, res) => {
    const profile = await storage.getAccessProfile(req.session.userId!);
    res.json(profile || null);
  });

  app.put("/api/access-profile", async (req, res) => {
    const profile = await storage.upsertAccessProfile(req.session.userId!, req.body);
    res.json(profile);
  });

  app.post("/api/chat/sessions", async (req, res) => {
    const session = await createChatSession(req.session.userId!);
    res.status(201).json(session);
  });

  app.get("/api/chat/sessions", async (req, res) => {
    const sessions = await getUserSessions(req.session.userId!);
    res.json(sessions);
  });

  app.get("/api/chat/sessions/:id/messages", async (req, res) => {
    const sessions = await getUserSessions(req.session.userId!);
    const owns = sessions.some((s) => s.id === req.params.id);
    if (!owns) return res.status(403).json({ message: "Access denied" });
    const msgs = await getSessionMessages(req.params.id);
    res.json(msgs);
  });

  app.delete("/api/chat/sessions/:id", async (req, res) => {
    const sessions = await getUserSessions(req.session.userId!);
    const owns = sessions.some((s) => s.id === req.params.id);
    if (!owns) return res.status(403).json({ message: "Access denied" });
    await deleteChatSession(req.params.id);
    res.status(204).send();
  });

  app.post("/api/chat/send", async (req, res) => {
    try {
      const { sessionId, message } = req.body;
      if (!sessionId || !message) return res.status(400).json({ message: "sessionId and message required" });
      const sessions = await getUserSessions(req.session.userId!);
      const owns = sessions.some((s) => s.id === sessionId);
      if (!owns) return res.status(403).json({ message: "Access denied" });
      const response = await processChat(sessionId, req.session.userId!, message);
      res.json(response);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get("/api/community-reports", async (_req, res) => {
    const reports = await storage.getCommunityReports();
    res.json(reports);
  });

  app.post("/api/community-reports", async (req, res) => {
    const { locationRef, barrierType, severity, description } = req.body;
    if (!locationRef || !barrierType || !severity) {
      return res.status(400).json({ message: "locationRef, barrierType, and severity are required" });
    }
    const report = await storage.createCommunityReport({
      reporterUserId: req.session.userId!,
      locationRef,
      barrierType,
      severity,
      description: description || null,
    });
    res.status(201).json(report);
  });

  app.get("/api/stripe/config", (_req, res) => {
    res.json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
      enabled: stripeEnabled(),
    });
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

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: amountCents,
      currency: "aud",
      customer: stripeCustomerId,
      payment_method_types: ["link", "card"],
      metadata: {
        invoiceId: invoice.id,
        participantId: invoice.participantId,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
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

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const invoiceId = pi.metadata?.invoiceId;
        if (invoiceId) {
          await storage.updateInvoicePayment(invoiceId, {
            stripePaymentStatus: "succeeded",
            status: "paid",
          });
        }
        break;
      }
      case "payment_intent.processing": {
        const pi = event.data.object;
        const invoiceId = pi.metadata?.invoiceId;
        if (invoiceId) {
          await storage.updateInvoicePayment(invoiceId, {
            stripePaymentStatus: "processing",
            status: "processing",
          });
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const invoiceId = pi.metadata?.invoiceId;
        if (invoiceId) {
          await storage.updateInvoicePayment(invoiceId, {
            stripePaymentStatus: "failed",
            status: "failed",
          });
        }
        break;
      }
    }

    res.json({ received: true });
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

  return httpServer;
}
