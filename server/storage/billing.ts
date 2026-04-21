import {
  type User, type InsertUser,
  type Worker, type InsertWorker,
  type Booking, type InsertBooking,
  type Job, type InsertJob,
  type TransportRequest, type InsertTransportRequest,
  type Message, type InsertMessage,
  type PricingTier, type InsertPricingTier,
  type ServiceSession, type InsertServiceSession,
  type TransportTrip, type InsertTransportTrip,
  type Invoice, type InsertInvoice,
  type Review, type InsertReview,
  type ParticipantBudget, type InsertParticipantBudget,
  type AccessContextProfile, type InsertAccessContextProfile,
  type CommunityReport, type InsertCommunityReport,
  type WorkerAvailability, type InsertWorkerAvailability,
  type WorkerBlockout, type InsertWorkerBlockout,
  type Shift, type InsertShift,
  type NdisPlanCache, type InsertNdisPlanCache,
  type GroceryProduct, type InsertGroceryProduct,
  type GroceryOrder, type InsertGroceryOrder,
  type GroceryOrderItem, type InsertGroceryOrderItem,
  users, workers, bookings, jobs, transportRequests, messages,
  pricingTiers, serviceSessions, transportTrips, invoices, reviews, participantBudgets,
  accessContextProfiles, communityReports,
  workerAvailability, workerBlockouts, shifts, ndisPlanCache,
  groceryProducts, groceryOrders, groceryOrderItems,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and, sql, gte, lte, inArray, isNotNull } from "drizzle-orm";

export const billingStorage = {
  async getPricingTiers(serviceType: string): Promise<PricingTier[]> {
    return db.select().from(pricingTiers).where(eq(pricingTiers.serviceType, serviceType));
  },

  async calculateCareRate(participantId: string, month: string): Promise<{ tier: string; rate: number; hoursUsed: number }> {
    const monthPrefix = month.substring(0, 7);
    const sessions = await db.select().from(serviceSessions)
      .where(and(
        eq(serviceSessions.participantId, participantId),
        sql`${serviceSessions.date} LIKE ${monthPrefix + '%'}`,
        eq(serviceSessions.status, "completed")
      ));

    const totalHours = sessions.reduce((sum, s) => sum + Number(s.actualHours || 0), 0);

    if (totalHours >= 31) return { tier: "High Support", rate: 65.00, hoursUsed: totalHours };
    if (totalHours >= 11) return { tier: "Standard Care", rate: 68.00, hoursUsed: totalHours };
    return { tier: "Basic Care", rate: 70.23, hoursUsed: totalHours };
  },

  async calculateTransportRate(participantId: string, month: string): Promise<{ tier: string; rate: number; kmUsed: number }> {
    const monthPrefix = month.substring(0, 7);
    const trips = await db.select().from(transportTrips)
      .where(and(
        eq(transportTrips.participantId, participantId),
        sql`${transportTrips.date} LIKE ${monthPrefix + '%'}`,
        eq(transportTrips.status, "completed")
      ));

    const totalKm = trips.reduce((sum, t) => sum + Number(t.distanceKm || 0), 0);

    if (totalKm >= 301) return { tier: "High Mobility", rate: 0.85, kmUsed: totalKm };
    if (totalKm >= 101) return { tier: "Standard Mobility", rate: 0.90, kmUsed: totalKm };
    return { tier: "Basic Mobility", rate: 0.99, kmUsed: totalKm };
  },

  async createServiceSession(data: InsertServiceSession): Promise<ServiceSession> {
    const [session] = await db.insert(serviceSessions).values(data).returning();
    return session;
  },

  async getServiceSessions(participantId: string): Promise<ServiceSession[]> {
    return db.select().from(serviceSessions)
      .where(eq(serviceSessions.participantId, participantId))
      .orderBy(desc(serviceSessions.date));
  },

  async createTransportTrip(data: InsertTransportTrip): Promise<TransportTrip> {
    const [trip] = await db.insert(transportTrips).values(data).returning();
    return trip;
  },

  async getTransportTrips(participantId: string): Promise<TransportTrip[]> {
    return db.select().from(transportTrips)
      .where(eq(transportTrips.participantId, participantId))
      .orderBy(desc(transportTrips.date));
  },

  async createInvoice(data: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(data).returning();
    return invoice;
  },

  async getInvoices(participantId: string): Promise<Invoice[]> {
    return db.select().from(invoices)
      .where(eq(invoices.participantId, participantId))
      .orderBy(desc(invoices.generatedAt));
  },

  async generateInvoice(participantId: string, periodStart: string, periodEnd: string): Promise<Invoice> {
    const sessions = await db.select().from(serviceSessions)
      .where(and(
        eq(serviceSessions.participantId, participantId),
        eq(serviceSessions.status, "completed"),
        gte(serviceSessions.date, periodStart),
        lte(serviceSessions.date, periodEnd)
      ));

    const trips = await db.select().from(transportTrips)
      .where(and(
        eq(transportTrips.participantId, participantId),
        eq(transportTrips.status, "completed"),
        gte(transportTrips.date, periodStart),
        lte(transportTrips.date, periodEnd)
      ));

    const workerIds = Array.from(new Set([
      ...sessions.map(s => s.workerId),
      ...trips.map(t => t.workerId),
    ]));
    const workerList = await this.getWorkersByIds(workerIds);
    const workerMap = new Map(workerList.map(w => [w.id, w]));
    const workerCharge = new Map<string, number>();

    const lineItems: any[] = [];
    let totalAmount = 0;
    let hasUnverifiedAbn = false;

    for (const s of sessions) {
      const charge = Number(s.totalCharge || 0);
      totalAmount += charge;
      workerCharge.set(s.workerId, (workerCharge.get(s.workerId) || 0) + charge);
      const worker = workerMap.get(s.workerId);
      const abnVerified = worker?.abnVerified ?? false;
      if (!abnVerified) hasUnverifiedAbn = true;
      lineItems.push({
        type: "care",
        ndisItemCode: s.ndisItemCode || "01_011_0107_1_1",
        description: `Care session - ${s.tierApplied || "Standard"}`,
        quantity: Number(s.actualHours || 0),
        unitRate: Number(s.hourlyRate || 0),
        subtotal: charge,
        date: s.date,
        workerId: s.workerId,
        workerAbn: worker?.abn || null,
        abnVerified,
      });
    }

    for (const t of trips) {
      const charge = Number(t.totalCharge || 0);
      totalAmount += charge;
      workerCharge.set(t.workerId, (workerCharge.get(t.workerId) || 0) + charge);
      const worker = workerMap.get(t.workerId);
      const abnVerified = worker?.abnVerified ?? false;
      if (!abnVerified) hasUnverifiedAbn = true;
      lineItems.push({
        type: "transport",
        ndisItemCode: t.ndisItemCode || "02_051_0108_1_1",
        description: `Transport trip - ${t.tierApplied || "Standard"}${t.accessibleVehicle ? " (Accessible Vehicle)" : ""}`,
        quantity: Number(t.distanceKm || 0),
        unitRate: Number(t.perKmRate || 0),
        subtotal: charge,
        date: t.date,
        workerId: t.workerId,
        workerAbn: worker?.abn || null,
        abnVerified,
      });
    }

    let providerId: string | null = null;
    if (workerCharge.size > 0) {
      const topWorkerId = [...workerCharge.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const topWorker = workerMap.get(topWorkerId);
      if (topWorker?.userId) providerId = topWorker.userId;
    }

    const [invoice] = await db.insert(invoices).values({
      participantId,
      providerId,
      periodStart,
      periodEnd,
      totalAmount: totalAmount.toFixed(2),
      ndisClaimable: totalAmount.toFixed(2),
      lineItems,
    }).returning();

    return invoice;
  },

  async getParticipantBudgets(participantId: string): Promise<ParticipantBudget[]> {
    return db.select().from(participantBudgets)
      .where(eq(participantBudgets.participantId, participantId));
  },

  async updateBudgetUsage(participantId: string, category: string, amount: number): Promise<ParticipantBudget | undefined> {
    const [budget] = await db.select().from(participantBudgets)
      .where(and(
        eq(participantBudgets.participantId, participantId),
        eq(participantBudgets.category, category)
      ));

    if (!budget) return undefined;

    const newUsed = Number(budget.totalUsed) + amount;
    const [updated] = await db.update(participantBudgets)
      .set({ totalUsed: newUsed.toFixed(2) })
      .where(eq(participantBudgets.id, budget.id))
      .returning();

    return updated;
  },

  async createReview(data: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(data).returning();

    const workerReviews = await db.select().from(reviews)
      .where(eq(reviews.workerId, data.workerId));
    const avgRating = workerReviews.reduce((sum, r) => sum + r.rating, 0) / workerReviews.length;

    await db.update(workers)
      .set({
        rating: avgRating.toFixed(2),
        reviewCount: workerReviews.length,
      })
      .where(eq(workers.id, data.workerId));

    return review;
  },

  async getReviewsForWorker(workerId: string): Promise<(Review & { participant?: User })[]> {
    const workerReviews = await db.select().from(reviews)
      .where(eq(reviews.workerId, workerId))
      .orderBy(desc(reviews.createdAt));

    return Promise.all(workerReviews.map(async (r) => {
      const participant = await this.getUser(r.participantId);
      return { ...r, participant: participant || undefined };
    }));
  },

  async getAccessProfile(userId: string): Promise<AccessContextProfile | undefined> {
    const [profile] = await db.select().from(accessContextProfiles)
      .where(eq(accessContextProfiles.userId, userId));
    return profile;
  },

  async upsertAccessProfile(userId: string, data: Partial<InsertAccessContextProfile>): Promise<AccessContextProfile> {
    const existing = await this.getAccessProfile(userId);
    if (existing) {
      const [updated] = await db.update(accessContextProfiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(accessContextProfiles.userId, userId))
        .returning();
      return updated;
    }
    const [created] = await db.insert(accessContextProfiles)
      .values({ ...data, userId })
      .returning();
    return created;
  },

  async getCommunityReports(): Promise<CommunityReport[]> {
    return db.select().from(communityReports)
      .orderBy(desc(communityReports.createdAt))
      .limit(50);
  },

  async createCommunityReport(data: InsertCommunityReport): Promise<CommunityReport> {
    const [report] = await db.insert(communityReports)
      .values({
        ...data,
        expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .returning();
    return report;
  },

  async updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  },

  async updateUserOrbIds(userId: string, orbCustomerId: string, orbSubscriptionId: string | null): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ orbCustomerId, orbSubscriptionId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  },

  async getInvoiceById(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  },

  async updateInvoicePayment(invoiceId: string, data: { stripePaymentIntentId?: string; stripePaymentStatus?: string; status?: string }): Promise<Invoice | undefined> {
    const setData: Record<string, any> = {};
    if (data.stripePaymentIntentId) setData.stripePaymentIntentId = data.stripePaymentIntentId;
    if (data.stripePaymentStatus) setData.stripePaymentStatus = data.stripePaymentStatus;
    if (data.status) setData.status = data.status;
    const [invoice] = await db.update(invoices)
      .set(setData)
      .where(eq(invoices.id, invoiceId))
      .returning();
    return invoice;
  }
};
