import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertBookingSchema } from "@shared/schema";
import { lookupProvider, prodaConfigured, ProdaNotConfiguredError, ProdaApiError } from "../ndis-api";
import { patchUserSchema, requireAuth, sanitizeUser } from "./shared";

export function registerAbnProfileRoutes(app: Express) {
  app.post("/api/abn/lookup", async (req, res) => {
    const { abn } = req.body;
    if (!abn) return res.status(400).json({ message: "ABN is required" });

    const { validateAbn, formatAbn, stripAbn } = await import("@shared/abn-utils");
    const validation = validateAbn(abn);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const digits = stripAbn(abn);
    const abnGuid = process.env.ABR_GUID || "";

    if (!abnGuid) {
      return res.json({
        abn: digits,
        abnFormatted: formatAbn(digits),
        entityName: "ABR lookup unavailable — ABN format is valid",
        businessNames: [],
        tradingNames: [],
        abnStatus: "Valid (format only)",
        abnStatusEffectiveFrom: "",
        entityTypeCode: "",
        entityTypeDescription: "",
        state: "",
        postcode: "",
        gstRegistered: false,
        gstRegisteredFrom: "",
        dgrEndorsed: false,
        lastUpdated: new Date().toISOString(),
        offline: true,
      });
    }

    try {
      const abrUrl = `https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/SearchByABNv202001?searchString=${digits}&includeHistoricalDetails=N&authenticationGuid=${abnGuid}`;
      const abrRes = await fetch(abrUrl);
      const xml = await abrRes.text();

      const getTag = (tag: string, src: string) => {
        const m = src.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
        return m ? m[1].trim() : "";
      };
      const identifierValue = getTag("identifierValue", xml);
      if (!identifierValue) {
        return res.status(404).json({ message: "ABN not found in Australian Business Register" });
      }

      const abnStatusBlock = xml.match(/<entityStatus>([\s\S]*?)<\/entityStatus>/)?.[1] || "";
      const abnStatus = getTag("entityStatusCode", abnStatusBlock);
      const abnStatusFrom = getTag("effectiveFrom", abnStatusBlock);

      const entityTypeBlock = xml.match(/<entityType>([\s\S]*?)<\/entityType>/)?.[1] || "";
      const entityTypeCode = getTag("entityTypeCode", entityTypeBlock);
      const entityTypeDescription = getTag("entityDescription", entityTypeBlock);

      const mainNameBlock = xml.match(/<mainName>([\s\S]*?)<\/mainName>/)?.[1] || "";
      const legalNameBlock = xml.match(/<legalName>([\s\S]*?)<\/legalName>/)?.[1] || "";
      let entityName = getTag("organisationName", mainNameBlock);
      if (!entityName) {
        const givenName = getTag("givenName", legalNameBlock);
        const familyName = getTag("familyName", legalNameBlock);
        entityName = [givenName, familyName].filter(Boolean).join(" ");
      }

      const businessNameBlocks = xml.match(/<businessName>([\s\S]*?)<\/businessName>/g) || [];
      const businessNames = businessNameBlocks.map(b => getTag("organisationName", b)).filter(Boolean);

      const tradingNameBlocks = xml.match(/<mainTradingName>([\s\S]*?)<\/mainTradingName>/g) || [];
      const tradingNames = tradingNameBlocks.map(b => getTag("organisationName", b)).filter(Boolean);

      const addressBlock = xml.match(/<mainBusinessPhysicalAddress>([\s\S]*?)<\/mainBusinessPhysicalAddress>/)?.[1] || "";
      const state = getTag("stateCode", addressBlock);
      const postcode = getTag("postcode", addressBlock);

      const gstBlocks = xml.match(/<goodsAndServicesTax>([\s\S]*?)<\/goodsAndServicesTax>/g) || [];
      let gstRegistered = false;
      let gstRegisteredFrom = "";
      for (const b of gstBlocks) {
        const to = getTag("effectiveTo", b);
        if (!to || to === "0001-01-01") {
          gstRegistered = true;
          gstRegisteredFrom = getTag("effectiveFrom", b);
          break;
        }
      }

      const dgrBlocks = xml.match(/<dgrEndorsement>([\s\S]*?)<\/dgrEndorsement>/g) || [];
      const dgrEndorsed = dgrBlocks.length > 0;

      res.json({
        abn: digits,
        abnFormatted: formatAbn(digits),
        entityName,
        businessNames,
        tradingNames,
        abnStatus,
        abnStatusEffectiveFrom: abnStatusFrom,
        entityTypeCode,
        entityTypeDescription,
        state,
        postcode,
        gstRegistered,
        gstRegisteredFrom,
        dgrEndorsed,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      console.error("ABR lookup error:", err);
      res.status(502).json({ message: "Failed to contact Australian Business Register" });
    }
  });

  app.get("/api/me", async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "No user found" });
    res.json(sanitizeUser(user));
  });

  app.patch("/api/me", async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ message: "No user found" });
    const parsed = patchUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const { fullName, email, location } = parsed.data;
    const updated = await storage.updateUserProfile(user.id, { fullName, email, location });
    if (!updated) return res.status(500).json({ message: "Update failed" });
    res.json(sanitizeUser(updated));
  });

  app.patch("/api/me/notification-prefs", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const schema = z.object({ notifyOrderUpdates: z.boolean().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const updated = await storage.updateUserNotificationPrefs(userId, parsed.data);
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json(sanitizeUser(updated));
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

  app.post("/api/workers/verify-abn", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) {
      return res.status(404).json({ message: "Worker profile not found" });
    }
    if (!worker.abn) {
      return res.status(400).json({ message: "No ABN set on worker profile. Please add your ABN first." });
    }
    if (worker.abnVerified) {
      return res.json({ message: "ABN already verified", abnVerified: true, abn: worker.abn });
    }
    const { validateAbn } = await import("@shared/abn-utils");
    const formatCheck = validateAbn(worker.abn);
    if (!formatCheck.valid) {
      return res.status(400).json({ message: formatCheck.error || "Invalid ABN format" });
    }

    if (prodaConfigured()) {
      try {
        const result = await lookupProvider(worker.abn);
        if (result && result.abn) {
          await storage.updateWorkerAbnVerified(worker.id, true);
          return res.json({ message: "ABN verified via NDIS provider registry", abnVerified: true, abn: worker.abn, businessName: result.businessName });
        }
      } catch (error) {
        if (error instanceof ProdaNotConfiguredError) {
          // fall through to ABR-only verification
        } else if (error instanceof ProdaApiError) {
          console.error("PRODA provider lookup failed:", error.message);
        } else {
          console.error("ABN verification error:", error);
          return res.status(500).json({ message: "Failed to verify ABN" });
        }
      }
    }

    await storage.updateWorkerAbnVerified(worker.id, true);
    return res.json({ message: "ABN verified via Australian Business Register format check", abnVerified: true, abn: worker.abn });
  });

  app.get("/api/workers/me/abn-status", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) {
      return res.json({ hasWorkerProfile: false, abn: null, abnVerified: false });
    }
    res.json({ hasWorkerProfile: true, abn: worker.abn, abnVerified: worker.abnVerified ?? false });
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
}
