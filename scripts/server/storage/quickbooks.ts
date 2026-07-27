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

export const quickBooksStorage = {
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
  },

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
  },

  async clearUserQbTokens(userId: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({
      qbAccessToken: null,
      qbRefreshToken: null,
      qbRealmId: null,
      qbTokenExpiresAt: null,
      qbConnectedAt: null,
    }).where(eq(users.id, userId)).returning();
    return user;
  },

  async updateInvoiceQbSync(invoiceId: string, data: { qbInvoiceId?: string; qbSyncStatus?: string; qbSyncError?: string | null; qbLastSyncedAt?: Date }): Promise<Invoice | undefined> {
    const setData: Record<string, any> = {};
    if (data.qbInvoiceId !== undefined) setData.qbInvoiceId = data.qbInvoiceId;
    if (data.qbSyncStatus !== undefined) setData.qbSyncStatus = data.qbSyncStatus;
    if (data.qbSyncError !== undefined) setData.qbSyncError = data.qbSyncError;
    if (data.qbLastSyncedAt !== undefined) setData.qbLastSyncedAt = data.qbLastSyncedAt;
    const [invoice] = await db.update(invoices).set(setData).where(eq(invoices.id, invoiceId)).returning();
    return invoice;
  },

  async getInvoicesByQbSyncStatus(status: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.qbSyncStatus, status)).orderBy(desc(invoices.generatedAt));
  },

  async getAllInvoicesForSync(participantId: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.participantId, participantId)).orderBy(desc(invoices.generatedAt));
  },

  async getUsersByQbRealmId(realmId: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.qbRealmId, realmId));
  },

  async getQbConnectedUsers(): Promise<User[]> {
    return db.select().from(users).where(isNotNull(users.qbRealmId));
  }
};
