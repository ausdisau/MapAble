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

export const usersWorkersStorage = {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  async getUserByAuth0Sub(auth0Sub: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.auth0Sub, auth0Sub));
    return user;
  },

  async getUserByRole(role: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.role, role as any));
    return user;
  },

  async updateUserAuth0Sub(id: string, auth0Sub: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ auth0Sub }).where(eq(users.id, id)).returning();
    return user;
  },

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  },

  async updateUserAvatar(id: string, avatar: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ avatar }).where(eq(users.id, id)).returning();
    return user;
  },

  async updateUserProfile(id: string, data: Partial<{ fullName: string; email: string; location: string }>): Promise<User | undefined> {
    const updateData: Record<string, string> = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.location !== undefined) updateData.location = data.location;
    if (Object.keys(updateData).length === 0) return this.getUser(id);
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  },

  async updateUserNotificationPrefs(id: string, prefs: { notifyOrderUpdates?: boolean }): Promise<User | undefined> {
    const updateData: Record<string, unknown> = {};
    if (prefs.notifyOrderUpdates !== undefined) updateData.notifyOrderUpdates = prefs.notifyOrderUpdates;
    if (Object.keys(updateData).length === 0) return this.getUser(id);
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  },

  async getWorkers(): Promise<(Worker & { user?: User })[]> {
    const allWorkers = await db.select().from(workers);
    const result = await Promise.all(
      allWorkers.map(async (w) => {
        const user = await this.getUser(w.userId);
        return { ...w, user: user || undefined };
      })
    );
    return result;
  },

  async getWorker(id: string): Promise<(Worker & { user?: User }) | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    if (!worker) return undefined;
    const user = await this.getUser(worker.userId);
    return { ...worker, user: user || undefined };
  },

  async createWorker(insertWorker: InsertWorker): Promise<Worker> {
    const [worker] = await db.insert(workers).values(insertWorker).returning();
    return worker;
  },

  async updateWorkerPhoto(id: string, photo: string): Promise<Worker | undefined> {
    const [worker] = await db.update(workers).set({ photo }).where(eq(workers.id, id)).returning();
    return worker;
  },

  async getBookings(): Promise<Booking[]> {
    return db.select().from(bookings);
  },

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  },

  async getJobs(): Promise<Job[]> {
    return db.select().from(jobs);
  },

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  },

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(insertJob).returning();
    return job;
  },

  async getTransportRequests(): Promise<TransportRequest[]> {
    return db.select().from(transportRequests);
  },

  async createTransportRequest(insertReq: InsertTransportRequest): Promise<TransportRequest> {
    const [req] = await db.insert(transportRequests).values(insertReq).returning();
    return req;
  },

  async getMessages(): Promise<Message[]> {
    return db.select().from(messages).orderBy(desc(messages.timestamp));
  },

  async createMessage(insertMsg: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(insertMsg).returning();
    return msg;
  }
};
