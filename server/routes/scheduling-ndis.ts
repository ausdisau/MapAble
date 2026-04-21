import type { Express } from "express";
import { storage } from "../storage";
import { insertWorkerAvailabilitySchema, insertWorkerBlockoutSchema, insertShiftSchema } from "@shared/schema";
import { syncParticipantPlan, getCachedPlan, fetchPriceGuide, validateRateAgainstPriceGuide, submitNdisClaim, ProdaNotConfiguredError, ProdaApiError, prodaConfigured } from "../ndis-api";
import { getWorkerIdForUser, requireAuth } from "./shared";

export function registerSchedulingNdisRoutes(app: Express) {
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
    if (isParticipant && !isOwnWorker) {
      const safeBlockouts = blockouts.map(({ reason, ...rest }) => ({ ...rest, reason: null }));
      return res.json(safeBlockouts);
    }
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

    if (user.role === "carer") {
      const enriched = await Promise.all(result.map(async (shift) => {
        const participant = shift.participantId ? await storage.getUser(shift.participantId) : null;
        return { ...shift, participantName: participant?.fullName || "Participant" };
      }));
      return res.json(enriched);
    }
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
    const { status, actualHours, notes: shiftNotes } = req.body;
    const validStatuses = ["scheduled", "confirmed", "in_progress", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(", ")}` });
    }

    const shift = await storage.getShift(req.params.id);
    if (!shift) return res.status(404).json({ message: "Shift not found" });

    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    const userWorkerId = await getWorkerIdForUser(userId);
    const isWorker = shift.workerId === userWorkerId;
    const isParticipant = shift.participantId === userId;
    if (!isWorker && !isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    const workerOnlyTransitions = ["confirmed", "in_progress", "completed"];
    if (workerOnlyTransitions.includes(status) && !isWorker) {
      return res.status(403).json({ message: "Only the assigned worker can perform this transition" });
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
      const hours = actualHours ? parseFloat(actualHours) : Math.max((endMins - startMins) / 60, 0.25);

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
        shiftNotes: shiftNotes || shift.notes || undefined,
      };
      sessionData.status = "completed";
      const session = await storage.createServiceSession(sessionData);

      if (session.totalCharge) {
        await storage.updateBudgetUsage(shift.participantId, "daily_living", Number(session.totalCharge));
      }

      const completionExtra: { actualHours?: string; notes?: string } = {};
      if (actualHours) completionExtra.actualHours = String(actualHours);
      if (shiftNotes !== undefined) completionExtra.notes = shiftNotes;
      const updated = await storage.updateShiftStatus(req.params.id, "completed", session.id, Object.keys(completionExtra).length ? completionExtra : undefined);
      return res.json({ shift: updated, session });
    }

    const extraData: { actualHours?: string; notes?: string } = {};
    if (actualHours) extraData.actualHours = String(actualHours);
    if (shiftNotes !== undefined) extraData.notes = shiftNotes;
    const updated = await storage.updateShiftStatus(req.params.id, status, undefined, Object.keys(extraData).length ? extraData : undefined);
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

  app.post("/api/ndis/sync-plan", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    try {
      const user = await storage.getUser(userId);
      const ndisNumber = user?.ndisNumber;
      if (!ndisNumber) {
        return res.status(400).json({ message: "User has no NDIS number on file" });
      }
      const plan = await syncParticipantPlan(userId, ndisNumber);
      res.json(plan);
    } catch (error) {
      if (error instanceof ProdaNotConfiguredError) {
        return res.status(503).json({ message: "NDIS PRODA not configured", code: error.code, missingEnvVars: error.missingEnvVars });
      }
      console.error("NDIS plan sync error:", error);
      res.status(error instanceof ProdaApiError ? error.status : 500).json({ message: "Failed to sync NDIS plan" });
    }
  });

  app.get("/api/ndis/plan/:participantId", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    if (req.params.participantId !== userId) {
      return res.status(403).json({ message: "You can only view your own NDIS plan" });
    }
    const plan = await getCachedPlan(req.params.participantId);
    if (!plan) return res.status(404).json({ message: "No cached plan found. Sync first." });
    res.json(plan);
  });

  app.get("/api/ndis/price-guide", requireAuth, async (req, res) => {
    const itemCode = req.query.itemCode as string | undefined;
    try {
      const items = await fetchPriceGuide(itemCode);
      res.json(items);
    } catch (error) {
      if (error instanceof ProdaNotConfiguredError) {
        return res.status(503).json({ message: "NDIS PRODA not configured", code: error.code, missingEnvVars: error.missingEnvVars });
      }
      console.error("Price guide fetch error:", error);
      res.status(error instanceof ProdaApiError ? error.status : 500).json({ message: "Failed to fetch price guide" });
    }
  });

  app.post("/api/ndis/validate-rate", requireAuth, async (req, res) => {
    const { itemCode, rate } = req.body;
    if (!itemCode || rate === undefined) {
      return res.status(400).json({ message: "itemCode and rate required" });
    }
    try {
      const priceGuide = await fetchPriceGuide(itemCode);
      const result = validateRateAgainstPriceGuide(itemCode, Number(rate), priceGuide);
      res.json(result);
    } catch (error) {
      if (error instanceof ProdaNotConfiguredError) {
        return res.status(503).json({ message: "NDIS PRODA not configured", code: error.code, missingEnvVars: error.missingEnvVars });
      }
      console.error("Validate rate error:", error);
      res.status(error instanceof ProdaApiError ? error.status : 500).json({ message: "Failed to validate rate" });
    }
  });

  app.post("/api/ndis/submit-claim", requireAuth, async (req, res) => {
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

    try {
      if (prodaConfigured()) {
        const priceGuideItems = await fetchPriceGuide(itemCode);
        if (priceGuideItems.length > 0) {
          const validation = validateRateAgainstPriceGuide(itemCode, Number(unitPrice), priceGuideItems);
          if (!validation.valid) {
            return res.status(400).json({ message: validation.message });
          }
        }
      }

      let providerUserId: string | null = null;
      let providerNdisRef: string | null = null;
      if (serviceSessionId) {
        const sessions = await storage.getServiceSessions(userId);
        const session = sessions.find(s => s.id === serviceSessionId);
        if (session?.workerId) {
          const worker = await storage.getWorker(session.workerId);
          providerUserId = worker?.userId ?? null;
          if (worker?.user?.ndisNumber) {
            providerNdisRef = `PROV-${worker.user.ndisNumber}`;
          } else if (worker?.abn) {
            providerNdisRef = `ABN-${worker.abn}`;
          }
        }
      }
      if (!providerUserId && req.body.invoiceId) {
        const inv = await storage.getInvoiceById(req.body.invoiceId);
        providerUserId = inv?.providerId ?? null;
        if (providerUserId) {
          const provUser = await storage.getUser(providerUserId);
          if (provUser?.ndisNumber) providerNdisRef = `PROV-${provUser.ndisNumber}`;
          else if (provUser?.abn) providerNdisRef = `ABN-${provUser.abn}`;
        }
      }

      if (!providerNdisRef) {
        return res.status(400).json({
          message: "Cannot submit claim: provider NDIS registration or ABN is not available for this session/invoice",
        });
      }

      const result = await submitNdisClaim({
        participantId: userId,
        providerId: providerUserId || userId,
        ndisProviderRef: providerNdisRef,
        invoiceId: req.body.invoiceId,
        serviceSessionId,
        itemCode,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        serviceDate,
        claimReference: claimReference || `REF-${Date.now()}`,
      });
      res.json(result);
    } catch (error) {
      if (error instanceof ProdaNotConfiguredError) {
        return res.status(503).json({ message: "NDIS PRODA not configured", code: error.code, missingEnvVars: error.missingEnvVars });
      }
      console.error("Claim submission error:", error);
      res.status(error instanceof ProdaApiError ? error.status : 500).json({ message: "Failed to submit claim" });
    }
  });
}
