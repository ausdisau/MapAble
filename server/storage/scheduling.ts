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

export const schedulingStorage = {
  async getWorkerAvailabilityById(id: string): Promise<WorkerAvailability | undefined> {
    const [slot] = await db.select().from(workerAvailability)
      .where(eq(workerAvailability.id, id));
    return slot;
  },
  async getWorkerAvailability(workerId: string): Promise<WorkerAvailability[]> {
    return db.select().from(workerAvailability)
      .where(eq(workerAvailability.workerId, workerId));
  },

  async createWorkerAvailability(data: InsertWorkerAvailability): Promise<WorkerAvailability> {
    const [slot] = await db.insert(workerAvailability).values(data).returning();
    return slot;
  },

  async deleteWorkerAvailability(id: string): Promise<void> {
    await db.delete(workerAvailability).where(eq(workerAvailability.id, id));
  },

  async setWorkerAvailabilityBulk(workerId: string, slots: InsertWorkerAvailability[]): Promise<WorkerAvailability[]> {
    await db.delete(workerAvailability).where(eq(workerAvailability.workerId, workerId));
    if (slots.length === 0) return [];
    const results = await db.insert(workerAvailability)
      .values(slots.map(s => ({ ...s, workerId })))
      .returning();
    return results;
  },

  async getWorkerBlockoutById(id: string): Promise<WorkerBlockout | undefined> {
    const [blockout] = await db.select().from(workerBlockouts)
      .where(eq(workerBlockouts.id, id));
    return blockout;
  },

  async getWorkerBlockouts(workerId: string): Promise<WorkerBlockout[]> {
    return db.select().from(workerBlockouts)
      .where(eq(workerBlockouts.workerId, workerId));
  },

  async createWorkerBlockout(data: InsertWorkerBlockout): Promise<WorkerBlockout> {
    const [blockout] = await db.insert(workerBlockouts).values(data).returning();
    return blockout;
  },

  async deleteWorkerBlockout(id: string): Promise<void> {
    await db.delete(workerBlockouts).where(eq(workerBlockouts.id, id));
  },

  async getWorkerByUserId(userId: string): Promise<(import("@shared/schema").Worker) | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.userId, userId));
    return worker;
  },

  async updateWorkerAbnVerified(workerId: string, abnVerified: boolean): Promise<Worker | undefined> {
    const [worker] = await db.update(workers).set({ abnVerified }).where(eq(workers.id, workerId)).returning();
    return worker;
  },

  async getWorkersByIds(ids: string[]): Promise<Worker[]> {
    if (ids.length === 0) return [];
    return db.select().from(workers).where(inArray(workers.id, ids));
  },

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
  },

  async getShift(id: string): Promise<Shift | undefined> {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, id));
    return shift;
  },

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
  },

  async createShift(data: InsertShift): Promise<Shift> {
    const [shift] = await db.insert(shifts).values(data).returning();
    return shift;
  },

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
  },

  async deleteShift(id: string): Promise<void> {
    await db.delete(shifts).where(eq(shifts.id, id));
  },

  async getNdisPlanGoals(participantId: string): Promise<NdisPlanCache | undefined> {
    const [plan] = await db
      .select()
      .from(ndisPlanCache)
      .where(eq(ndisPlanCache.participantId, participantId))
      .orderBy(desc(ndisPlanCache.fetchedAt))
      .limit(1);
    return plan;
  }
};
