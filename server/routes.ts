import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
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
  insertWorkerAvailabilitySchema,
  insertWorkerBlockoutSchema,
  insertShiftSchema,
} from "@shared/schema";
import { z } from "zod";
import { syncParticipantPlan, getCachedPlan, fetchPriceGuide, validateRateAgainstPriceGuide, submitNdisClaim } from "./ndis-api";

async function getWorkerIdForUser(userId: string): Promise<string | null> {
  const worker = await storage.getWorkerByUserId(userId);
  return worker?.id || null;
}
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
    res.json({ ...safeUser, auth0Login: !!req.session.auth0Login });
  });

  const auth0Domain = process.env.AUTH0_DOMAIN || "";
  const auth0ClientId = process.env.AUTH0_CLIENT_ID || "";
  const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET || "";
  const auth0Enabled = !!(auth0Domain && auth0ClientId && auth0ClientSecret);

  function getAuth0CallbackUrl() {
    const replitDomain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS || "";
    if (replitDomain) return `https://${replitDomain}/api/auth/auth0/callback`;
    return "http://localhost:5000/api/auth/auth0/callback";
  }

  function getAuth0LogoutReturnUrl() {
    const replitDomain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS || "";
    if (replitDomain) return `https://${replitDomain}`;
    return "http://localhost:5000";
  }

  interface Auth0UserInfo {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    nickname?: string;
    picture?: string;
  }

  async function getAuth0UserInfo(accessToken: string): Promise<Auth0UserInfo | null> {
    const response = await fetch(`https://${auth0Domain}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    return response.json() as Promise<Auth0UserInfo>;
  }

  async function findOrCreateAuth0User(userInfo: Auth0UserInfo) {
    const sub = userInfo.sub || "";
    const email = userInfo.email || "";
    const emailVerified = !!userInfo.email_verified;
    const name = userInfo.name || userInfo.nickname || "Auth0 User";
    const picture = userInfo.picture || "";

    if (sub) {
      const user = await storage.getUserByAuth0Sub(sub);
      if (user) return user;
    }

    if (email && emailVerified) {
      const user = await storage.getUserByEmail(email);
      if (user) {
        if (sub) await storage.updateUserAuth0Sub(user.id, sub);
        return user;
      }
    }

    const id = "auth0_" + crypto.createHash("md5").update(sub || email).digest("hex").substring(0, 12);
    let username = email ? email.split("@")[0] : "user_" + crypto.createHash("md5").update(sub).digest("hex").substring(0, 8);

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      username += "_" + crypto.createHash("md5").update(sub).digest("hex").substring(0, 4);
    }

    return storage.createUser({
      id,
      username,
      password: "",
      fullName: name,
      email,
      role: "participant",
      avatar: picture,
      auth0Sub: sub,
      isVerified: true,
    });
  }

  app.get("/api/auth/auth0/config", (_req, res) => {
    res.json({
      enabled: auth0Enabled,
      domain: auth0Enabled ? auth0Domain : null,
    });
  });

  app.get("/api/auth/auth0/login", (req, res) => {
    if (!auth0Enabled) {
      return res.status(404).json({ message: "Auth0 not configured" });
    }

    const connection = typeof req.query.connection === "string" ? req.query.connection : undefined;

    const verifier = crypto.randomBytes(32).toString("base64url");
    const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
    const state = crypto.randomBytes(16).toString("hex");

    req.session.auth0State = state;
    req.session.auth0CodeVerifier = verifier;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: auth0ClientId,
      redirect_uri: getAuth0CallbackUrl(),
      scope: "openid profile email",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    if (connection) {
      params.set("connection", connection);
    }

    req.session.save(() => {
      res.redirect(`https://${auth0Domain}/authorize?${params.toString()}`);
    });
  });

  app.get("/api/auth/auth0/callback", async (req, res) => {
    if (!auth0Enabled) {
      return res.redirect("/?error=auth0_not_configured");
    }

    const { code, state, error } = req.query;

    if (error) {
      console.error("Auth0 callback error:", error, req.query.error_description);
      return res.redirect("/?error=auth0_denied");
    }

    if (!code || !state || state !== req.session.auth0State) {
      return res.redirect("/?error=auth0_invalid_state");
    }

    try {
      const tokenResponse = await fetch(`https://${auth0Domain}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: auth0ClientId,
          client_secret: auth0ClientSecret,
          code,
          redirect_uri: getAuth0CallbackUrl(),
          code_verifier: req.session.auth0CodeVerifier || "",
        }),
      });

      if (!tokenResponse.ok) {
        console.error("Auth0 token exchange failed:", await tokenResponse.text());
        return res.redirect("/?error=auth0_token_failed");
      }

      const tokens = await tokenResponse.json() as { access_token: string };

      const userInfo = await getAuth0UserInfo(tokens.access_token);
      if (!userInfo) {
        return res.redirect("/?error=auth0_userinfo_failed");
      }

      const user = await findOrCreateAuth0User(userInfo);

      req.session.userId = user.id;
      req.session.auth0Login = true;
      delete req.session.auth0State;
      delete req.session.auth0CodeVerifier;

      req.session.save(() => {
        res.redirect("/");
      });
    } catch (err) {
      console.error("Auth0 callback error:", err);
      res.redirect("/?error=auth0_server_error");
    }
  });

  app.post("/api/auth/auth0/logout", (req, res) => {
    const wasAuth0 = !!req.session.auth0Login;
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.clearCookie("connect.sid");
      if (wasAuth0 && auth0Enabled) {
        const params = new URLSearchParams({
          client_id: auth0ClientId,
          returnTo: getAuth0LogoutReturnUrl(),
        });
        res.json({ auth0LogoutUrl: `https://${auth0Domain}/v2/logout?${params.toString()}` });
      } else {
        res.json({ message: "Logged out" });
      }
    });
  });

  app.use("/api", (req, res, next) => {
    if (
      req.path === "/auth/login" ||
      req.path === "/auth/logout" ||
      req.path === "/auth/me" ||
      req.path === "/auth/auth0/config" ||
      req.path === "/auth/auth0/login" ||
      req.path === "/auth/auth0/callback" ||
      req.path === "/auth/auth0/logout" ||
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

  app.get("/api/worker-availability/:workerId", async (req, res) => {
    const userId = req.session.userId!;
    const userWorkerId = await getWorkerIdForUser(userId);
    const user = await storage.getUser(userId);
    const isOwnWorker = userWorkerId === req.params.workerId;
    const isParticipant = user?.role === "participant";
    if (!isOwnWorker && !isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }
    const slots = await storage.getWorkerAvailability(req.params.workerId);
    res.json(slots);
  });

  app.post("/api/worker-availability", async (req, res) => {
    const parsed = insertWorkerAvailabilitySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const userWorkerId = await getWorkerIdForUser(req.session.userId!);
    if (!userWorkerId || userWorkerId !== parsed.data.workerId) {
      return res.status(403).json({ message: "You can only manage your own availability" });
    }
    const slot = await storage.createWorkerAvailability(parsed.data);
    res.status(201).json(slot);
  });

  app.delete("/api/worker-availability/:id", async (req, res) => {
    const slot = await storage.getWorkerAvailabilityById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Not found" });
    const userWorkerId = await getWorkerIdForUser(req.session.userId!);
    if (!userWorkerId || userWorkerId !== slot.workerId) {
      return res.status(403).json({ message: "You can only delete your own availability" });
    }
    await storage.deleteWorkerAvailability(req.params.id);
    res.status(204).send();
  });

  app.put("/api/worker-availability/:workerId/bulk", async (req, res) => {
    const userWorkerId = await getWorkerIdForUser(req.session.userId!);
    if (!userWorkerId || userWorkerId !== req.params.workerId) {
      return res.status(403).json({ message: "You can only manage your own availability" });
    }
    const { slots } = req.body;
    if (!Array.isArray(slots)) return res.status(400).json({ message: "slots array required" });
    const results = await storage.setWorkerAvailabilityBulk(req.params.workerId, slots);
    res.json(results);
  });

  app.get("/api/worker-blockouts/:workerId", async (req, res) => {
    const userId = req.session.userId!;
    const userWorkerId = await getWorkerIdForUser(userId);
    const user = await storage.getUser(userId);
    const isOwnWorker = userWorkerId === req.params.workerId;
    const isParticipant = user?.role === "participant";
    if (!isOwnWorker && !isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }
    const blockouts = await storage.getWorkerBlockouts(req.params.workerId);
    res.json(blockouts);
  });

  app.post("/api/worker-blockouts", async (req, res) => {
    const parsed = insertWorkerBlockoutSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const userWorkerId = await getWorkerIdForUser(req.session.userId!);
    if (!userWorkerId || userWorkerId !== parsed.data.workerId) {
      return res.status(403).json({ message: "You can only manage your own blockouts" });
    }
    const blockout = await storage.createWorkerBlockout(parsed.data);
    res.status(201).json(blockout);
  });

  app.delete("/api/worker-blockouts/:id", async (req, res) => {
    const blockout = await storage.getWorkerBlockoutById(req.params.id);
    if (!blockout) return res.status(404).json({ message: "Not found" });
    const userWorkerId = await getWorkerIdForUser(req.session.userId!);
    if (!userWorkerId || userWorkerId !== blockout.workerId) {
      return res.status(403).json({ message: "You can only delete your own blockouts" });
    }
    await storage.deleteWorkerBlockout(req.params.id);
    res.status(204).send();
  });

  app.get("/api/shifts", async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    const userWorkerId = await getWorkerIdForUser(userId);
    const { dateFrom, dateTo } = req.query as Record<string, string>;

    if (user?.role !== "participant" && user?.role !== "carer") {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await storage.getShifts({
      participantId: user.role === "participant" ? userId : undefined,
      workerId: user.role === "carer" ? (userWorkerId || undefined) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    res.json(result);
  });

  app.get("/api/shifts/:id", async (req, res) => {
    const shift = await storage.getShift(req.params.id);
    if (!shift) return res.status(404).json({ message: "Shift not found" });
    const userId = req.session.userId!;
    const userWorkerId = await getWorkerIdForUser(userId);
    if (shift.participantId !== userId && shift.workerId !== userWorkerId) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(shift);
  });

  app.post("/api/shifts", async (req, res) => {
    const parsed = insertShiftSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

    const data = parsed.data;
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "participant") {
      return res.status(403).json({ message: "Only participants can book shifts" });
    }
    if (data.participantId !== userId) {
      return res.status(403).json({ message: "You can only book shifts for yourself" });
    }

    const workerAvail = await storage.getWorkerAvailability(data.workerId);
    const workerBlockoutDates = await storage.getWorkerBlockouts(data.workerId);

    const validateShiftDate = (shiftDate: string, startTime: string, endTime: string) => {
      const blockoutDates = workerBlockoutDates.map(b => b.date);
      if (blockoutDates.includes(shiftDate)) {
        return "Worker has blocked out this date";
      }
      if (workerAvail.length > 0) {
        const dayOfWeek = new Date(shiftDate + "T12:00:00").getDay();
        const daySlots = workerAvail.filter(a => a.dayOfWeek === dayOfWeek);
        if (daySlots.length === 0) {
          return "Worker is not available on this day";
        }
        const fitsSlot = daySlots.some(slot => startTime >= slot.startTime && endTime <= slot.endTime);
        if (!fitsSlot) {
          return "Shift time does not fit within worker's available hours";
        }
      }
      return null;
    };

    const validationError = validateShiftDate(data.date, data.startTime, data.endTime);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (data.recurrenceRule && data.recurrenceRule !== "none") {
      const createdShifts = [];
      const baseDate = new Date(data.date);
      const weeks = data.recurrenceRule === "weekly" ? 12 : data.recurrenceRule === "fortnightly" ? 6 : 1;

      for (let i = 0; i < weeks; i++) {
        const shiftDate = new Date(baseDate);
        shiftDate.setDate(shiftDate.getDate() + (i * (data.recurrenceRule === "fortnightly" ? 14 : 7)));
        const dateStr = `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, "0")}-${String(shiftDate.getDate()).padStart(2, "0")}`;
        const err = validateShiftDate(dateStr, data.startTime, data.endTime);
        if (err) continue;
        const shift = await storage.createShift({
          ...data,
          date: dateStr,
        });
        createdShifts.push(shift);
      }
      return res.status(201).json(createdShifts);
    }

    const shift = await storage.createShift(data);
    res.status(201).json(shift);
  });

  app.patch("/api/shifts/:id/status", async (req, res) => {
    const { status } = req.body;
    const validStatuses = ["scheduled", "confirmed", "in_progress", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(", ")}` });
    }

    const shift = await storage.getShift(req.params.id);
    if (!shift) return res.status(404).json({ message: "Shift not found" });

    const userId = req.session.userId!;
    const userWorkerId = await getWorkerIdForUser(userId);
    if (shift.participantId !== userId && shift.workerId !== userWorkerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (shift.status === "completed") {
      return res.status(400).json({ message: "Shift is already completed" });
    }
    if (shift.status === "cancelled") {
      return res.status(400).json({ message: "Shift is cancelled and cannot be updated" });
    }

    const validTransitions: Record<string, string[]> = {
      scheduled: ["confirmed", "cancelled"],
      confirmed: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
    };
    if (!validTransitions[shift.status]?.includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${shift.status} to ${status}` });
    }

    if (status === "completed" && !shift.serviceSessionId) {
      const startParts = shift.startTime.split(":");
      const endParts = shift.endTime.split(":");
      const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1] || "0");
      const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1] || "0");
      const hours = Math.max((endMins - startMins) / 60, 0.25);

      const shiftDateObj = new Date(shift.date + "T12:00:00");
      const dayOfWeek = shiftDateObj.getDay();
      const startHour = parseInt(startParts[0]);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isEvening = startHour >= 20 || endParts[0] && parseInt(endParts[0]) >= 20;
      const category = shift.ndisCategory || "Core";

      let ndisItemCode: string;
      if (category === "Capacity Building" || category === "capacity_building") {
        ndisItemCode = "04_104_0125_6_1";
      } else if (isWeekend) {
        ndisItemCode = "01_012_0107_1_1";
      } else if (isEvening) {
        ndisItemCode = "01_013_0107_1_1";
      } else {
        ndisItemCode = "01_011_0107_1_1";
      }

      const rateInfo = await storage.calculateCareRate(shift.participantId, shift.date);

      const priceGuideItems = await fetchPriceGuide(ndisItemCode);
      let effectiveRate = rateInfo.rate;
      if (priceGuideItems.length > 0) {
        const validation = validateRateAgainstPriceGuide(ndisItemCode, rateInfo.rate, priceGuideItems);
        if (!validation.valid && validation.maxRate) {
          effectiveRate = validation.maxRate;
        }
      }

      const totalCharge = (hours * effectiveRate).toFixed(2);

      const sessionData: Parameters<typeof storage.createServiceSession>[0] & { status?: string } = {
        workerId: shift.workerId,
        participantId: shift.participantId,
        startTime: shift.startTime,
        endTime: shift.endTime,
        actualHours: hours.toFixed(2),
        hourlyRate: effectiveRate.toFixed(2),
        tierApplied: rateInfo.tier,
        totalCharge,
        ndisItemCode,
        date: shift.date,
        shiftNotes: shift.notes || undefined,
      };
      sessionData.status = "completed";
      const session = await storage.createServiceSession(sessionData);

      if (session.totalCharge) {
        await storage.updateBudgetUsage(shift.participantId, "daily_living", Number(session.totalCharge));
      }

      const updated = await storage.updateShiftStatus(req.params.id, "completed", session.id);
      return res.json({ shift: updated, session });
    }

    const updated = await storage.updateShiftStatus(req.params.id, status);
    res.json({ shift: updated });
  });

  app.delete("/api/shifts/:id", async (req, res) => {
    const shift = await storage.getShift(req.params.id);
    if (!shift) return res.status(404).json({ message: "Shift not found" });
    const userId = req.session.userId!;
    const userWorkerId = await getWorkerIdForUser(userId);
    if (shift.participantId !== userId && shift.workerId !== userWorkerId) {
      return res.status(403).json({ message: "Access denied" });
    }
    await storage.deleteShift(req.params.id);
    res.status(204).send();
  });

  app.post("/api/ndis/sync-plan", async (req, res) => {
    const userId = req.session.userId!;
    try {
      const user = await storage.getUser(userId);
      const ndisNumber = user?.ndisNumber || undefined;
      const plan = await syncParticipantPlan(userId, ndisNumber);
      res.json(plan);
    } catch (error) {
      console.error("NDIS plan sync error:", error);
      res.status(500).json({ message: "Failed to sync NDIS plan" });
    }
  });

  app.get("/api/ndis/plan/:participantId", async (req, res) => {
    const userId = req.session.userId!;
    if (req.params.participantId !== userId) {
      return res.status(403).json({ message: "You can only view your own NDIS plan" });
    }
    const plan = await getCachedPlan(req.params.participantId);
    if (!plan) return res.status(404).json({ message: "No cached plan found. Sync first." });
    res.json(plan);
  });

  app.get("/api/ndis/price-guide", async (_req, res) => {
    const itemCode = _req.query.itemCode as string | undefined;
    const items = await fetchPriceGuide(itemCode);
    res.json(items);
  });

  app.post("/api/ndis/validate-rate", async (req, res) => {
    const { itemCode, rate } = req.body;
    if (!itemCode || rate === undefined) {
      return res.status(400).json({ message: "itemCode and rate required" });
    }
    const priceGuide = await fetchPriceGuide(itemCode);
    const result = validateRateAgainstPriceGuide(itemCode, Number(rate), priceGuide);
    res.json(result);
  });

  app.post("/api/ndis/submit-claim", async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "participant") {
      return res.status(403).json({ message: "Only participants can submit claims" });
    }

    const { itemCode, quantity, unitPrice, serviceDate, claimReference, serviceSessionId } = req.body;
    if (!itemCode || !quantity || !unitPrice || !serviceDate) {
      return res.status(400).json({ message: "itemCode, quantity, unitPrice, and serviceDate are required" });
    }

    if (serviceSessionId) {
      const sessions = await storage.getServiceSessions(userId);
      const ownsSession = sessions.some(s => s.id === serviceSessionId);
      if (!ownsSession) {
        return res.status(403).json({ message: "You can only submit claims for your own service sessions" });
      }
    }

    const priceGuideItems = await fetchPriceGuide(itemCode);
    if (priceGuideItems.length > 0) {
      const validation = validateRateAgainstPriceGuide(itemCode, Number(unitPrice), priceGuideItems);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }
    }

    try {
      const result = await submitNdisClaim({
        participantId: userId,
        providerId: user.ndisNumber ? `PROV-${user.ndisNumber}` : "MAPABLE-001",
        itemCode,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        serviceDate,
        claimReference: claimReference || `REF-${Date.now()}`,
      });
      res.json(result);
    } catch (error) {
      console.error("Claim submission error:", error);
      res.status(500).json({ message: "Failed to submit claim" });
    }
  });

  return httpServer;
}
