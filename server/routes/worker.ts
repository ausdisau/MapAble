import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth } from "./shared";

export function registerWorkerRoutes(app: Express) {
  app.get("/api/worker/me", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });
    const fullWorker = await storage.getWorker(worker.id);
    res.json(fullWorker);
  });

  app.patch("/api/worker/me", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const { fullName, email, location, phoneNumber, bio, title, specializations, hourlyRate, transportCapable, wheelchairAccessible, transportType, languages, insuranceExpiry, firstAidExpiry, wwccNumber, wwccExpiry, screeningNumber, screeningExpiry } = req.body;
    if (fullName || email || location) {
      await storage.updateUserProfile(userId, { fullName, email, location });
    }
    if (phoneNumber !== undefined || bio !== undefined || languages !== undefined) {
      const updateData: Record<string, any> = {};
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (bio !== undefined) updateData.bio = bio;
      if (languages !== undefined) updateData.languages = languages;
      const { eq } = await import("drizzle-orm");
      const { users } = await import("@shared/schema");
      const { db } = await import("../db");
      await db.update(users).set(updateData).where(eq(users.id, userId));
    }

    const workerFields = { title, specializations, hourlyRate, transportCapable, wheelchairAccessible, transportType, insuranceExpiry, firstAidExpiry, wwccNumber, wwccExpiry, screeningNumber, screeningExpiry };
    if (Object.values(workerFields).some(v => v !== undefined)) {
      const workerUpdate: Record<string, any> = {};
      for (const [k, v] of Object.entries(workerFields)) {
        if (v !== undefined) workerUpdate[k] = v;
      }
      if (Object.keys(workerUpdate).length > 0) {
        const { eq } = await import("drizzle-orm");
        const { workers } = await import("@shared/schema");
        const { db } = await import("../db");
        await db.update(workers).set(workerUpdate).where(eq(workers.id, worker.id));
      }
    }

    const updatedWorker = await storage.getWorker(worker.id);
    res.json(updatedWorker);
  });

  app.get("/api/worker/bookings", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const allBookings = await storage.getBookings();
    const workerBookings = allBookings.filter(b => b.workerId === worker.id);

    const enriched = await Promise.all(workerBookings.map(async (b) => {
      const participant = await storage.getUser(b.participantId);
      return { ...b, participant: participant ? { id: participant.id, fullName: participant.fullName, email: participant.email, location: participant.location } : null };
    }));

    res.json(enriched);
  });

  app.patch("/api/worker/bookings/:id/status", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const { status } = req.body;
    const validStatuses = ["confirmed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(", ")}` });
    }

    const allBookings = await storage.getBookings();
    const booking = allBookings.find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.workerId !== worker.id) {
      return res.status(403).json({ message: "Not your booking" });
    }

    const { eq } = await import("drizzle-orm");
    const { bookings } = await import("@shared/schema");
    const { db } = await import("../db");
    const [updated] = await db.update(bookings).set({ status }).where(eq(bookings.id, String(req.params.id))).returning();
    res.json(updated);
  });

  app.post("/api/worker/bookings/:id/start-shift", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const allBookings = await storage.getBookings();
    const booking = allBookings.find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.workerId !== worker.id) {
      return res.status(403).json({ message: "Not your booking" });
    }
    if (booking.status !== "confirmed") {
      return res.status(400).json({ message: "Booking must be confirmed to start a shift" });
    }

    const existingShifts = await storage.getShifts({ workerId: worker.id });
    const activeShift = existingShifts.find(s => s.status === "in_progress");
    if (activeShift) {
      return res.status(400).json({ message: "You already have an active shift in progress. Complete it before starting a new one." });
    }

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const startTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const shift = await storage.createShift({
      workerId: worker.id,
      participantId: booking.participantId,
      date: today,
      startTime,
      endTime: booking.endTime || "17:00",
      status: "in_progress",
      notes: booking.notes || null,
    });

    const { eq } = await import("drizzle-orm");
    const { bookings } = await import("@shared/schema");
    const { db } = await import("../db");
    await db.update(bookings).set({ status: "in_progress" }).where(eq(bookings.id, booking.id));

    res.json({ shift, message: "Shift started from booking" });
  });

  app.get("/api/worker/earnings", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const workerShifts = await storage.getShifts({ workerId: worker.id });
    const completedShifts = workerShifts.filter(s => s.status === "completed");

    let totalEarnings = 0;
    const earningsByMonth: Record<string, number> = {};
    for (const shift of completedShifts) {
      const startParts = shift.startTime.split(":");
      const endParts = shift.endTime.split(":");
      const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1] || "0");
      const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1] || "0");
      const hours = Math.max((endMins - startMins) / 60, 0.25);
      const rate = Number(worker.hourlyRate || 0);
      const earned = hours * rate;
      totalEarnings += earned;
      const month = shift.date.substring(0, 7);
      earningsByMonth[month] = (earningsByMonth[month] || 0) + earned;
    }

    res.json({
      totalEarnings: totalEarnings.toFixed(2),
      completedShifts: completedShifts.length,
      totalShifts: workerShifts.length,
      hourlyRate: worker.hourlyRate,
      earningsByMonth,
    });
  });

  app.get("/api/worker/reviews", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const reviews = await storage.getReviewsForWorker(worker.id);
    res.json(reviews);
  });

  app.get("/api/worker/dashboard", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "carer") {
      return res.status(403).json({ message: "Not a worker account" });
    }
    const worker = await storage.getWorkerByUserId(userId);
    if (!worker) return res.status(404).json({ message: "Worker profile not found" });

    const today = new Date().toISOString().split("T")[0];
    const allShifts = await storage.getShifts({ workerId: worker.id });
    const todayShiftsRaw = allShifts.filter(s => s.date === today);
    const upcomingShiftsRaw = allShifts.filter(s => s.date >= today && s.status !== "cancelled" && s.status !== "completed").slice(0, 5);
    const completedCount = allShifts.filter(s => s.status === "completed").length;
    const activeShiftRaw = todayShiftsRaw.find(s => s.status === "in_progress") || null;

    const enrichShift = async (s: typeof allShifts[number]) => {
      const participant = await storage.getUser(s.participantId);
      return { ...s, participantName: participant?.fullName || "Unknown" };
    };
    const todayShifts = await Promise.all(todayShiftsRaw.map(enrichShift));
    const upcomingShifts = await Promise.all(upcomingShiftsRaw.map(enrichShift));
    const activeShift = activeShiftRaw ? await enrichShift(activeShiftRaw) : null;

    const allBookings = await storage.getBookings();
    const pendingBookings = allBookings.filter(b => b.workerId === worker.id && b.status === "pending");
    const upcomingBookingsRaw = allBookings.filter(b => b.workerId === worker.id && (b.status === "confirmed" || b.status === "pending") && (b.date || "") >= today).slice(0, 5);

    const enrichBooking = async (b: typeof allBookings[number]) => {
      const participant = await storage.getUser(b.participantId);
      return { ...b, participantName: participant?.fullName || "Unknown" };
    };
    const enrichedPendingBookings = await Promise.all(pendingBookings.map(enrichBooking));
    const upcomingBookings = await Promise.all(upcomingBookingsRaw.map(enrichBooking));

    const reviews = await storage.getReviewsForWorker(worker.id);

    const complianceAlerts: string[] = [];
    const checkExpiry = (label: string, dateStr: string | null) => {
      if (!dateStr) { complianceAlerts.push(`${label} not on file`); return; }
      const expiryDate = new Date(dateStr);
      const daysUntil = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) complianceAlerts.push(`${label} has expired`);
      else if (daysUntil <= 30) complianceAlerts.push(`${label} expires in ${daysUntil} days`);
    };
    checkExpiry("Insurance", worker.insuranceExpiry);
    checkExpiry("First Aid Certificate", worker.firstAidExpiry);
    checkExpiry("WWCC", worker.wwccExpiry);
    checkExpiry("Screening Clearance", worker.screeningExpiry);
    if (!worker.ndisVerified) complianceAlerts.push("NDIS verification pending");

    const currentMonth = today.substring(0, 7);
    const monthShifts = allShifts.filter(s => s.date?.startsWith(currentMonth) && s.status === "completed");
    const monthHours = monthShifts.reduce((sum, s) => {
      const actualHours = (s as { actualHours?: string | null }).actualHours;
      if (actualHours) return sum + Number(actualHours);
      const sp = s.startTime.split(":"), ep = s.endTime.split(":");
      const mins = (parseInt(ep[0]) * 60 + parseInt(ep[1] || "0")) - (parseInt(sp[0]) * 60 + parseInt(sp[1] || "0"));
      return sum + Math.max(mins / 60, 0.25);
    }, 0);
    const hourlyRate = Number(worker.hourlyRate || 0);
    const monthEarnings = monthHours * hourlyRate;

    const activeBookings = allBookings.filter(b => b.workerId === worker.id && (b.status === "confirmed" || b.status === "in_progress"));

    res.json({
      worker,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
      todayShifts,
      upcomingShifts,
      activeShift,
      completedCount,
      totalShifts: allShifts.length,
      pendingBookings: enrichedPendingBookings,
      upcomingBookings,
      activeBookingsCount: activeBookings.length,
      monthHours: Math.round(monthHours * 10) / 10,
      monthEarnings: Math.round(monthEarnings * 100) / 100,
      rating: worker.rating,
      reviewCount: worker.reviewCount,
      recentReviews: reviews.slice(0, 3),
      complianceAlerts,
    });
  });

}
