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
import { db } from "./db";
import { eq, desc, and, sql, gte, lte, inArray, isNotNull } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAuth0Sub(auth0Sub: string): Promise<User | undefined>;
  getUserByRole(role: string): Promise<User | undefined>;
  updateUserAuth0Sub(id: string, auth0Sub: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserAvatar(id: string, avatar: string): Promise<User | undefined>;
  updateUserProfile(id: string, data: Partial<{ fullName: string; email: string; location: string }>): Promise<User | undefined>;
  getWorkers(): Promise<(Worker & { user?: User })[]>;
  getWorker(id: string): Promise<(Worker & { user?: User }) | undefined>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  updateWorkerPhoto(id: string, photo: string): Promise<Worker | undefined>;
  getBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  getJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  getTransportRequests(): Promise<TransportRequest[]>;
  createTransportRequest(req: InsertTransportRequest): Promise<TransportRequest>;
  getMessages(): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;

  getPricingTiers(serviceType: string): Promise<PricingTier[]>;
  calculateCareRate(participantId: string, month: string): Promise<{ tier: string; rate: number; hoursUsed: number }>;
  calculateTransportRate(participantId: string, month: string): Promise<{ tier: string; rate: number; kmUsed: number }>;
  createServiceSession(data: InsertServiceSession): Promise<ServiceSession>;
  getServiceSessions(participantId: string): Promise<ServiceSession[]>;
  createTransportTrip(data: InsertTransportTrip): Promise<TransportTrip>;
  getTransportTrips(participantId: string): Promise<TransportTrip[]>;
  createInvoice(data: InsertInvoice): Promise<Invoice>;
  getInvoices(participantId: string): Promise<Invoice[]>;
  generateInvoice(participantId: string, periodStart: string, periodEnd: string): Promise<Invoice>;
  getParticipantBudgets(participantId: string): Promise<ParticipantBudget[]>;
  updateBudgetUsage(participantId: string, category: string, amount: number): Promise<ParticipantBudget | undefined>;
  createReview(data: InsertReview): Promise<Review>;
  getReviewsForWorker(workerId: string): Promise<(Review & { participant?: User })[]>;
  getAccessProfile(userId: string): Promise<AccessContextProfile | undefined>;
  upsertAccessProfile(userId: string, data: Partial<InsertAccessContextProfile>): Promise<AccessContextProfile>;
  getCommunityReports(): Promise<CommunityReport[]>;
  createCommunityReport(data: InsertCommunityReport): Promise<CommunityReport>;
  updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined>;
  updateUserOrbIds(userId: string, orbCustomerId: string, orbSubscriptionId: string | null): Promise<User | undefined>;
  getInvoiceById(id: string): Promise<Invoice | undefined>;
  updateInvoicePayment(invoiceId: string, data: { stripePaymentIntentId?: string; stripePaymentStatus?: string; status?: string }): Promise<Invoice | undefined>;
  getWorkerAvailability(workerId: string): Promise<WorkerAvailability[]>;
  getWorkerAvailabilityById(id: string): Promise<WorkerAvailability | undefined>;
  createWorkerAvailability(data: InsertWorkerAvailability): Promise<WorkerAvailability>;
  deleteWorkerAvailability(id: string): Promise<void>;
  setWorkerAvailabilityBulk(workerId: string, slots: InsertWorkerAvailability[]): Promise<WorkerAvailability[]>;
  getWorkerBlockouts(workerId: string): Promise<WorkerBlockout[]>;
  getWorkerBlockoutById(id: string): Promise<WorkerBlockout | undefined>;
  createWorkerBlockout(data: InsertWorkerBlockout): Promise<WorkerBlockout>;
  deleteWorkerBlockout(id: string): Promise<void>;
  getWorkerByUserId(userId: string): Promise<(import("@shared/schema").Worker) | undefined>;
  updateWorkerAbnVerified(workerId: string, abnVerified: boolean): Promise<Worker | undefined>;
  getWorkersByIds(ids: string[]): Promise<Worker[]>;
  getShifts(filters: { participantId?: string; workerId?: string; dateFrom?: string; dateTo?: string }): Promise<Shift[]>;
  getShift(id: string): Promise<Shift | undefined>;
  createShift(data: InsertShift): Promise<Shift>;
  updateShiftStatus(id: string, status: string, serviceSessionId?: string): Promise<Shift | undefined>;
  deleteShift(id: string): Promise<void>;
  getUpcomingShifts(participantId: string): Promise<Shift[]>;
  getNdisPlanGoals(participantId: string): Promise<NdisPlanCache | undefined>;
  getPendingInvoices(participantId: string): Promise<Invoice[]>;
  updateUserQbTokens(userId: string, data: { qbAccessToken: string; qbRefreshToken: string; qbRealmId: string; qbTokenExpiresAt: Date; qbConnectedAt?: Date }): Promise<User | undefined>;
  clearUserQbTokens(userId: string): Promise<User | undefined>;
  updateInvoiceQbSync(invoiceId: string, data: { qbInvoiceId?: string; qbSyncStatus?: string; qbSyncError?: string | null; qbLastSyncedAt?: Date }): Promise<Invoice | undefined>;
  getInvoicesByQbSyncStatus(status: string): Promise<Invoice[]>;
  getAllInvoicesForSync(participantId: string): Promise<Invoice[]>;
  getUsersByQbRealmId(realmId: string): Promise<User[]>;
  getQbConnectedUsers(): Promise<User[]>;

  getGroceryProducts(filters?: { category?: string; search?: string }): Promise<GroceryProduct[]>;
  getGroceryProduct(id: string): Promise<GroceryProduct | undefined>;
  createGroceryProduct(data: InsertGroceryProduct): Promise<GroceryProduct>;
  createGroceryOrder(
    order: InsertGroceryOrder,
    items: { productId: string; quantity: number; unitPrice: string }[]
  ): Promise<GroceryOrder>;
  getGroceryOrders(participantId: string): Promise<GroceryOrder[]>;
  getGroceryOrder(id: string): Promise<(GroceryOrder & { items: (GroceryOrderItem & { product?: GroceryProduct })[] }) | undefined>;
  updateGroceryOrderStatus(id: string, status: string): Promise<GroceryOrder | undefined>;
  updateGroceryOrderPayment(id: string, data: { stripePaymentIntentId?: string; paymentStatus?: string }): Promise<GroceryOrder | undefined>;
  getActiveGroceryOrders(participantId: string): Promise<GroceryOrder[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByAuth0Sub(auth0Sub: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.auth0Sub, auth0Sub));
    return user;
  }

  async getUserByRole(role: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.role, role));
    return user;
  }

  async updateUserAuth0Sub(id: string, auth0Sub: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ auth0Sub }).where(eq(users.id, id)).returning();
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserAvatar(id: string, avatar: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ avatar }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserProfile(id: string, data: Partial<{ fullName: string; email: string; location: string }>): Promise<User | undefined> {
    const updateData: Record<string, string> = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.location !== undefined) updateData.location = data.location;
    if (Object.keys(updateData).length === 0) return this.getUser(id);
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }

  async getWorkers(): Promise<(Worker & { user?: User })[]> {
    const allWorkers = await db.select().from(workers);
    const result = await Promise.all(
      allWorkers.map(async (w) => {
        const user = await this.getUser(w.userId);
        return { ...w, user: user || undefined };
      })
    );
    return result;
  }

  async getWorker(id: string): Promise<(Worker & { user?: User }) | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    if (!worker) return undefined;
    const user = await this.getUser(worker.userId);
    return { ...worker, user: user || undefined };
  }

  async createWorker(insertWorker: InsertWorker): Promise<Worker> {
    const [worker] = await db.insert(workers).values(insertWorker).returning();
    return worker;
  }

  async updateWorkerPhoto(id: string, photo: string): Promise<Worker | undefined> {
    const [worker] = await db.update(workers).set({ photo }).where(eq(workers.id, id)).returning();
    return worker;
  }

  async getBookings(): Promise<Booking[]> {
    return db.select().from(bookings);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async getJobs(): Promise<Job[]> {
    return db.select().from(jobs);
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(insertJob).returning();
    return job;
  }

  async getTransportRequests(): Promise<TransportRequest[]> {
    return db.select().from(transportRequests);
  }

  async createTransportRequest(insertReq: InsertTransportRequest): Promise<TransportRequest> {
    const [req] = await db.insert(transportRequests).values(insertReq).returning();
    return req;
  }

  async getMessages(): Promise<Message[]> {
    return db.select().from(messages).orderBy(desc(messages.timestamp));
  }

  async createMessage(insertMsg: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(insertMsg).returning();
    return msg;
  }

  async getPricingTiers(serviceType: string): Promise<PricingTier[]> {
    return db.select().from(pricingTiers).where(eq(pricingTiers.serviceType, serviceType));
  }

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
  }

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
  }

  async createServiceSession(data: InsertServiceSession): Promise<ServiceSession> {
    const [session] = await db.insert(serviceSessions).values(data).returning();
    return session;
  }

  async getServiceSessions(participantId: string): Promise<ServiceSession[]> {
    return db.select().from(serviceSessions)
      .where(eq(serviceSessions.participantId, participantId))
      .orderBy(desc(serviceSessions.date));
  }

  async createTransportTrip(data: InsertTransportTrip): Promise<TransportTrip> {
    const [trip] = await db.insert(transportTrips).values(data).returning();
    return trip;
  }

  async getTransportTrips(participantId: string): Promise<TransportTrip[]> {
    return db.select().from(transportTrips)
      .where(eq(transportTrips.participantId, participantId))
      .orderBy(desc(transportTrips.date));
  }

  async createInvoice(data: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(data).returning();
    return invoice;
  }

  async getInvoices(participantId: string): Promise<Invoice[]> {
    return db.select().from(invoices)
      .where(eq(invoices.participantId, participantId))
      .orderBy(desc(invoices.generatedAt));
  }

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

    const lineItems: any[] = [];
    let totalAmount = 0;
    let hasUnverifiedAbn = false;

    for (const s of sessions) {
      const charge = Number(s.totalCharge || 0);
      totalAmount += charge;
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

    const [invoice] = await db.insert(invoices).values({
      participantId,
      periodStart,
      periodEnd,
      totalAmount: totalAmount.toFixed(2),
      ndisClaimable: totalAmount.toFixed(2),
      lineItems,
    }).returning();

    return invoice;
  }

  async getParticipantBudgets(participantId: string): Promise<ParticipantBudget[]> {
    return db.select().from(participantBudgets)
      .where(eq(participantBudgets.participantId, participantId));
  }

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
  }

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
  }

  async getReviewsForWorker(workerId: string): Promise<(Review & { participant?: User })[]> {
    const workerReviews = await db.select().from(reviews)
      .where(eq(reviews.workerId, workerId))
      .orderBy(desc(reviews.createdAt));

    return Promise.all(workerReviews.map(async (r) => {
      const participant = await this.getUser(r.participantId);
      return { ...r, participant: participant || undefined };
    }));
  }

  async getAccessProfile(userId: string): Promise<AccessContextProfile | undefined> {
    const [profile] = await db.select().from(accessContextProfiles)
      .where(eq(accessContextProfiles.userId, userId));
    return profile;
  }

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
  }

  async getCommunityReports(): Promise<CommunityReport[]> {
    return db.select().from(communityReports)
      .orderBy(desc(communityReports.createdAt))
      .limit(50);
  }

  async createCommunityReport(data: InsertCommunityReport): Promise<CommunityReport> {
    const [report] = await db.insert(communityReports)
      .values({
        ...data,
        expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .returning();
    return report;
  }

  async updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserOrbIds(userId: string, orbCustomerId: string, orbSubscriptionId: string | null): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ orbCustomerId, orbSubscriptionId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getInvoiceById(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

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

  async getWorkerAvailabilityById(id: string): Promise<WorkerAvailability | undefined> {
    const [slot] = await db.select().from(workerAvailability)
      .where(eq(workerAvailability.id, id));
    return slot;
  }
  async getWorkerAvailability(workerId: string): Promise<WorkerAvailability[]> {
    return db.select().from(workerAvailability)
      .where(eq(workerAvailability.workerId, workerId));
  }

  async createWorkerAvailability(data: InsertWorkerAvailability): Promise<WorkerAvailability> {
    const [slot] = await db.insert(workerAvailability).values(data).returning();
    return slot;
  }

  async deleteWorkerAvailability(id: string): Promise<void> {
    await db.delete(workerAvailability).where(eq(workerAvailability.id, id));
  }

  async setWorkerAvailabilityBulk(workerId: string, slots: InsertWorkerAvailability[]): Promise<WorkerAvailability[]> {
    await db.delete(workerAvailability).where(eq(workerAvailability.workerId, workerId));
    if (slots.length === 0) return [];
    const results = await db.insert(workerAvailability)
      .values(slots.map(s => ({ ...s, workerId })))
      .returning();
    return results;
  }

  async getWorkerBlockoutById(id: string): Promise<WorkerBlockout | undefined> {
    const [blockout] = await db.select().from(workerBlockouts)
      .where(eq(workerBlockouts.id, id));
    return blockout;
  }

  async getWorkerBlockouts(workerId: string): Promise<WorkerBlockout[]> {
    return db.select().from(workerBlockouts)
      .where(eq(workerBlockouts.workerId, workerId));
  }

  async createWorkerBlockout(data: InsertWorkerBlockout): Promise<WorkerBlockout> {
    const [blockout] = await db.insert(workerBlockouts).values(data).returning();
    return blockout;
  }

  async deleteWorkerBlockout(id: string): Promise<void> {
    await db.delete(workerBlockouts).where(eq(workerBlockouts.id, id));
  }

  async getWorkerByUserId(userId: string): Promise<(import("@shared/schema").Worker) | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.userId, userId));
    return worker;
  }

  async updateWorkerAbnVerified(workerId: string, abnVerified: boolean): Promise<Worker | undefined> {
    const [worker] = await db.update(workers).set({ abnVerified }).where(eq(workers.id, workerId)).returning();
    return worker;
  }

  async getWorkersByIds(ids: string[]): Promise<Worker[]> {
    if (ids.length === 0) return [];
    return db.select().from(workers).where(inArray(workers.id, ids));
  }

  async getShifts(filters: { participantId?: string; workerId?: string; dateFrom?: string; dateTo?: string }): Promise<Shift[]> {
    const conditions = [];
    if (filters.participantId) conditions.push(eq(shifts.participantId, filters.participantId));
    if (filters.workerId) conditions.push(eq(shifts.workerId, filters.workerId));
    if (filters.dateFrom) conditions.push(gte(shifts.date, filters.dateFrom));
    if (filters.dateTo) conditions.push(lte(shifts.date, filters.dateTo));

    if (conditions.length === 0) {
      return db.select().from(shifts).orderBy(desc(shifts.date));
    }
    return db.select().from(shifts)
      .where(and(...conditions))
      .orderBy(desc(shifts.date));
  }

  async getShift(id: string): Promise<Shift | undefined> {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, id));
    return shift;
  }

  async getUpcomingShifts(participantId: string): Promise<Shift[]> {
    const today = new Date().toISOString().split("T")[0];
    return db
      .select()
      .from(shifts)
      .where(
        and(
          eq(shifts.participantId, participantId),
          gte(shifts.date, today),
          inArray(shifts.status, ["scheduled", "confirmed"]),
        )
      )
      .orderBy(shifts.date, shifts.startTime)
      .limit(20);
  }

  async createShift(data: InsertShift): Promise<Shift> {
    const [shift] = await db.insert(shifts).values(data).returning();
    return shift;
  }

  async updateShiftStatus(id: string, status: string, serviceSessionId?: string, extraData?: { actualHours?: string; notes?: string }): Promise<Shift | undefined> {
    const updateData: Record<string, any> = { status };
    if (serviceSessionId) updateData.serviceSessionId = serviceSessionId;
    if (extraData?.actualHours) updateData.actualHours = extraData.actualHours;
    if (extraData?.notes !== undefined) updateData.notes = extraData.notes;
    const [shift] = await db.update(shifts)
      .set(updateData)
      .where(eq(shifts.id, id))
      .returning();
    return shift;
  }

  async deleteShift(id: string): Promise<void> {
    await db.delete(shifts).where(eq(shifts.id, id));
  }

  async getNdisPlanGoals(participantId: string): Promise<NdisPlanCache | undefined> {
    const [plan] = await db
      .select()
      .from(ndisPlanCache)
      .where(eq(ndisPlanCache.participantId, participantId))
      .orderBy(desc(ndisPlanCache.fetchedAt))
      .limit(1);
    return plan;
  }

  async getPendingInvoices(participantId: string): Promise<Invoice[]> {
    return db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.participantId, participantId),
          inArray(invoices.status, ["draft", "submitted", "pending"]),
        )
      )
      .orderBy(desc(invoices.generatedAt));
  }

  async updateUserQbTokens(userId: string, data: { qbAccessToken: string; qbRefreshToken: string; qbRealmId: string; qbTokenExpiresAt: Date; qbConnectedAt?: Date }): Promise<User | undefined> {
    const setData: Record<string, any> = {
      qbAccessToken: data.qbAccessToken,
      qbRefreshToken: data.qbRefreshToken,
      qbRealmId: data.qbRealmId,
      qbTokenExpiresAt: data.qbTokenExpiresAt,
    };
    if (data.qbConnectedAt) setData.qbConnectedAt = data.qbConnectedAt;
    const [user] = await db.update(users).set(setData).where(eq(users.id, userId)).returning();
    return user;
  }

  async clearUserQbTokens(userId: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({
      qbAccessToken: null,
      qbRefreshToken: null,
      qbRealmId: null,
      qbTokenExpiresAt: null,
      qbConnectedAt: null,
    }).where(eq(users.id, userId)).returning();
    return user;
  }

  async updateInvoiceQbSync(invoiceId: string, data: { qbInvoiceId?: string; qbSyncStatus?: string; qbSyncError?: string | null; qbLastSyncedAt?: Date }): Promise<Invoice | undefined> {
    const setData: Record<string, any> = {};
    if (data.qbInvoiceId !== undefined) setData.qbInvoiceId = data.qbInvoiceId;
    if (data.qbSyncStatus !== undefined) setData.qbSyncStatus = data.qbSyncStatus;
    if (data.qbSyncError !== undefined) setData.qbSyncError = data.qbSyncError;
    if (data.qbLastSyncedAt !== undefined) setData.qbLastSyncedAt = data.qbLastSyncedAt;
    const [invoice] = await db.update(invoices).set(setData).where(eq(invoices.id, invoiceId)).returning();
    return invoice;
  }

  async getInvoicesByQbSyncStatus(status: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.qbSyncStatus, status)).orderBy(desc(invoices.generatedAt));
  }

  async getAllInvoicesForSync(participantId: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.participantId, participantId)).orderBy(desc(invoices.generatedAt));
  }

  async getUsersByQbRealmId(realmId: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.qbRealmId, realmId));
  }

  async getQbConnectedUsers(): Promise<User[]> {
    return db.select().from(users).where(isNotNull(users.qbRealmId));
  }

  async getGroceryProducts(filters?: { category?: string; search?: string }): Promise<GroceryProduct[]> {
    const conditions = [];
    if (filters?.category) conditions.push(eq(groceryProducts.category, filters.category as GroceryProduct["category"]));
    if (filters?.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      conditions.push(sql`LOWER(${groceryProducts.name}) LIKE ${term}`);
    }
    if (conditions.length === 0) {
      return db.select().from(groceryProducts).orderBy(groceryProducts.name);
    }
    return db.select().from(groceryProducts).where(and(...conditions)).orderBy(groceryProducts.name);
  }

  async getGroceryProduct(id: string): Promise<GroceryProduct | undefined> {
    const [p] = await db.select().from(groceryProducts).where(eq(groceryProducts.id, id));
    return p;
  }

  async createGroceryProduct(data: InsertGroceryProduct): Promise<GroceryProduct> {
    const [p] = await db.insert(groceryProducts).values(data).returning();
    return p;
  }

  async createGroceryOrder(
    order: InsertGroceryOrder,
    items: { productId: string; quantity: number; unitPrice: string }[]
  ): Promise<GroceryOrder> {
    const [created] = await db.insert(groceryOrders).values(order).returning();
    if (items.length > 0) {
      await db.insert(groceryOrderItems).values(
        items.map((i) => ({
          orderId: created.id,
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        }))
      );
    }
    return created;
  }

  async getGroceryOrders(participantId: string): Promise<GroceryOrder[]> {
    return db
      .select()
      .from(groceryOrders)
      .where(eq(groceryOrders.participantId, participantId))
      .orderBy(desc(groceryOrders.createdAt));
  }

  async getGroceryOrder(id: string): Promise<(GroceryOrder & { items: (GroceryOrderItem & { product?: GroceryProduct })[] }) | undefined> {
    const [order] = await db.select().from(groceryOrders).where(eq(groceryOrders.id, id));
    if (!order) return undefined;
    const items = await db.select().from(groceryOrderItems).where(eq(groceryOrderItems.orderId, id));
    const itemsWithProducts = await Promise.all(
      items.map(async (it) => {
        const product = await this.getGroceryProduct(it.productId);
        return { ...it, product };
      })
    );
    return { ...order, items: itemsWithProducts };
  }

  async updateGroceryOrderStatus(id: string, status: string): Promise<GroceryOrder | undefined> {
    const [order] = await db
      .update(groceryOrders)
      .set({ status: status as GroceryOrder["status"] })
      .where(eq(groceryOrders.id, id))
      .returning();
    return order;
  }

  async updateGroceryOrderPayment(id: string, data: { stripePaymentIntentId?: string; paymentStatus?: string }): Promise<GroceryOrder | undefined> {
    const setData: Record<string, any> = {};
    if (data.stripePaymentIntentId !== undefined) setData.stripePaymentIntentId = data.stripePaymentIntentId;
    if (data.paymentStatus !== undefined) setData.paymentStatus = data.paymentStatus;
    const [order] = await db.update(groceryOrders).set(setData).where(eq(groceryOrders.id, id)).returning();
    return order;
  }

  async getActiveGroceryOrders(participantId: string): Promise<GroceryOrder[]> {
    return db
      .select()
      .from(groceryOrders)
      .where(
        and(
          eq(groceryOrders.participantId, participantId),
          inArray(groceryOrders.status, ["placed", "confirmed", "shopping", "out_for_delivery"])
        )
      )
      .orderBy(desc(groceryOrders.createdAt));
  }
}

export const storage = new DatabaseStorage();
