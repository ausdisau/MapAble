import type { Express } from "express";
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
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  registerObjectStorageRoutes(app);

  app.get("/api/me", async (_req, res) => {
    const user = await storage.getUserByRole("participant");
    if (!user) return res.status(404).json({ message: "No user found" });
    const { password, ...safeUser } = user;
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
      (data as any).status = "completed";
    }

    const session = await storage.createServiceSession(data);

    if (session.totalCharge) {
      await storage.updateBudgetUsage(data.participantId, "daily_living", Number(session.totalCharge));
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
      (data as any).status = "completed";
    }

    const trip = await storage.createTransportTrip(data);

    if (trip.totalCharge) {
      await storage.updateBudgetUsage(data.participantId, "transport", Number(trip.totalCharge));
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

  return httpServer;
}
