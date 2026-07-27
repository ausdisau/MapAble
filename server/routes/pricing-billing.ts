import type { Express } from "express";
import { storage } from "../storage";
import { insertServiceSessionSchema, insertTransportTripSchema, insertReviewSchema } from "@shared/schema";
import { orbEnabled, ingestCareHoursEvent, ingestTransportKmEvent } from "../orb";
import { qbEnabled, pushInvoiceToQb } from "../quickbooks";
import { requireAuth, provisionOrbBilling } from "./shared";

export function registerPricingBillingRoutes(app: Express) {
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
    const items = (invoice.lineItems as any[]) || [];
    const unverifiedCount = items.filter((item: any) => item.abnVerified === false).length;
    const response: any = { ...invoice };
    if (unverifiedCount > 0) {
      response.abnWarning = `${unverifiedCount} line item(s) have workers/providers with unverified ABNs. Payment will be blocked until all ABNs are verified.`;
    }

    if (qbEnabled()) {
      const user = await storage.getUser(participantId);
      if (user?.qbAccessToken && user?.qbRealmId) {
        pushInvoiceToQb(participantId, invoice.id).catch((err) => {
          console.error("Auto QB sync failed for new invoice:", err);
        });
      }
    }

    res.status(201).json(response);
  });

  app.get("/api/invoices", async (req, res) => {
    const participantId = req.query.participantId as string;
    if (!participantId) return res.status(400).json({ message: "participantId required" });
    const invoiceList = await storage.getInvoices(participantId);
    res.json(invoiceList);
  });

  app.patch("/api/invoices/:id/status", requireAuth, async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "status required" });
    const invoice = await storage.getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.participantId !== req.session.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const updated = await storage.updateInvoicePayment(req.params.id, { status });
    if (updated && updated.qbInvoiceId && qbEnabled()) {
      pushInvoiceToQb(invoice.participantId, invoice.id).catch((err) =>
        console.error("QB re-sync after invoice status update failed:", err)
      );
    }
    res.json(updated);
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
}
