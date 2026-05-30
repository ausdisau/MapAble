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
  type BecsMandate, type InsertBecsMandate,
  type NdisClaim, type InsertNdisClaim,
  users, workers, bookings, jobs, transportRequests, messages,
  pricingTiers, serviceSessions, transportTrips, invoices, reviews, participantBudgets,
  accessContextProfiles, communityReports,
  workerAvailability, workerBlockouts, shifts, ndisPlanCache,
  groceryProducts, groceryOrders, groceryOrderItems,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and, sql, gte, lte, inArray, isNotNull } from "drizzle-orm";
import { usersWorkersStorage } from "./users-workers";
  import { billingStorage } from "./billing";
  import { schedulingStorage } from "./scheduling";
  import { quickBooksStorage } from "./quickbooks";
  import { groceryStorage } from "./grocery";
  import { paymentsStorage } from "./payments";

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
  updateUserNotificationPrefs(id: string, prefs: { notifyOrderUpdates?: boolean }): Promise<User | undefined>;
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
  updateShiftStatus(id: string, status: string, serviceSessionId?: string, extraData?: { actualHours?: string; notes?: string }): Promise<Shift | undefined>;
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
  upsertSupplierGroceryProduct(data: InsertGroceryProduct): Promise<GroceryProduct>;
  deleteGroceryProductsBySource(source: string): Promise<number>;
  getGroceryCatalogStatus(): Promise<{ productCount: number; bySource: Record<string, number>; lastSyncedAt: string | null }>;
  createGroceryOrder(
    order: InsertGroceryOrder,
    items: { productId: string; quantity: number; unitPrice: string }[]
  ): Promise<GroceryOrder>;
  getGroceryOrders(participantId: string): Promise<GroceryOrder[]>;
  getGroceryOrder(id: string): Promise<(GroceryOrder & { items: (GroceryOrderItem & { product?: GroceryProduct })[] }) | undefined>;
  updateGroceryOrderStatus(id: string, status: string): Promise<GroceryOrder | undefined>;
  updateGroceryOrderPayment(id: string, data: { stripePaymentIntentId?: string; paymentStatus?: string }): Promise<GroceryOrder | undefined>;
  deleteGroceryOrder(id: string): Promise<boolean>;
  getActiveGroceryOrders(participantId: string): Promise<GroceryOrder[]>;

  createBecsMandate(data: InsertBecsMandate): Promise<BecsMandate>;
  getBecsMandates(userId: string): Promise<BecsMandate[]>;
  getBecsMandate(id: string): Promise<BecsMandate | undefined>;
  getBecsMandateByPaymentMethod(stripePaymentMethodId: string): Promise<BecsMandate | undefined>;
  updateBecsMandateStatus(stripePaymentMethodId: string, status: string, mandateUrl?: string, stripeMandateId?: string): Promise<BecsMandate | undefined>;
  deleteBecsMandate(id: string): Promise<boolean>;
  setDefaultBecsMandate(userId: string, mandateId: string): Promise<BecsMandate | undefined>;
  getDefaultBecsMandate(userId: string): Promise<BecsMandate | undefined>;
  setUserAutoDebit(userId: string, enabled: boolean, graceDays?: number): Promise<User | undefined>;
  setStripeAccount(userId: string, data: { stripeAccountId?: string | null; stripeAccountStatus?: string | null; stripeChargesEnabled?: boolean; stripePayoutsEnabled?: boolean; stripeRequirementsDue?: unknown }): Promise<User | undefined>;
  getUserByStripeAccountId(stripeAccountId: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  createNdisClaim(data: InsertNdisClaim): Promise<NdisClaim>;
  getNdisClaims(filters?: { participantId?: string; invoiceId?: string; providerId?: string; limit?: number }): Promise<NdisClaim[]>;
  wasWebhookProcessed(eventId: string): Promise<boolean>;
  recordWebhookEvent(eventId: string, eventType: string): Promise<void>;
  claimWebhookEvent(eventId: string, eventType: string): Promise<boolean>;
  releaseWebhookEvent(eventId: string): Promise<void>;
  getInvoicesAwaitingAutoDebit(): Promise<(Invoice & { user?: User })[]>;
  recordPayoutEvent(data: { stripeId: string; kind: string; status: string; userId?: string | null; amountCents?: number | null; currency?: string | null; failureMessage?: string | null; payload?: Record<string, unknown> | null }): Promise<unknown>;
  listPayoutEvents(userId: string, limit?: number): Promise<unknown[]>;
}


export class DatabaseStorage implements IStorage {
  getUser(...args: Parameters<IStorage["getUser"]>): ReturnType<IStorage["getUser"]> {
    return (usersWorkersStorage.getUser as any).apply(this, args);
  }

  getUserByUsername(...args: Parameters<IStorage["getUserByUsername"]>): ReturnType<IStorage["getUserByUsername"]> {
    return (usersWorkersStorage.getUserByUsername as any).apply(this, args);
  }

  getUserByEmail(...args: Parameters<IStorage["getUserByEmail"]>): ReturnType<IStorage["getUserByEmail"]> {
    return (usersWorkersStorage.getUserByEmail as any).apply(this, args);
  }

  getUserByAuth0Sub(...args: Parameters<IStorage["getUserByAuth0Sub"]>): ReturnType<IStorage["getUserByAuth0Sub"]> {
    return (usersWorkersStorage.getUserByAuth0Sub as any).apply(this, args);
  }

  getUserByRole(...args: Parameters<IStorage["getUserByRole"]>): ReturnType<IStorage["getUserByRole"]> {
    return (usersWorkersStorage.getUserByRole as any).apply(this, args);
  }

  updateUserAuth0Sub(...args: Parameters<IStorage["updateUserAuth0Sub"]>): ReturnType<IStorage["updateUserAuth0Sub"]> {
    return (usersWorkersStorage.updateUserAuth0Sub as any).apply(this, args);
  }

  createUser(...args: Parameters<IStorage["createUser"]>): ReturnType<IStorage["createUser"]> {
    return (usersWorkersStorage.createUser as any).apply(this, args);
  }

  updateUserAvatar(...args: Parameters<IStorage["updateUserAvatar"]>): ReturnType<IStorage["updateUserAvatar"]> {
    return (usersWorkersStorage.updateUserAvatar as any).apply(this, args);
  }

  updateUserProfile(...args: Parameters<IStorage["updateUserProfile"]>): ReturnType<IStorage["updateUserProfile"]> {
    return (usersWorkersStorage.updateUserProfile as any).apply(this, args);
  }

  updateUserNotificationPrefs(...args: Parameters<IStorage["updateUserNotificationPrefs"]>): ReturnType<IStorage["updateUserNotificationPrefs"]> {
    return (usersWorkersStorage.updateUserNotificationPrefs as any).apply(this, args);
  }

  getWorkers(...args: Parameters<IStorage["getWorkers"]>): ReturnType<IStorage["getWorkers"]> {
    return (usersWorkersStorage.getWorkers as any).apply(this, args);
  }

  getWorker(...args: Parameters<IStorage["getWorker"]>): ReturnType<IStorage["getWorker"]> {
    return (usersWorkersStorage.getWorker as any).apply(this, args);
  }

  createWorker(...args: Parameters<IStorage["createWorker"]>): ReturnType<IStorage["createWorker"]> {
    return (usersWorkersStorage.createWorker as any).apply(this, args);
  }

  updateWorkerPhoto(...args: Parameters<IStorage["updateWorkerPhoto"]>): ReturnType<IStorage["updateWorkerPhoto"]> {
    return (usersWorkersStorage.updateWorkerPhoto as any).apply(this, args);
  }

  getBookings(...args: Parameters<IStorage["getBookings"]>): ReturnType<IStorage["getBookings"]> {
    return (usersWorkersStorage.getBookings as any).apply(this, args);
  }

  createBooking(...args: Parameters<IStorage["createBooking"]>): ReturnType<IStorage["createBooking"]> {
    return (usersWorkersStorage.createBooking as any).apply(this, args);
  }

  getJobs(...args: Parameters<IStorage["getJobs"]>): ReturnType<IStorage["getJobs"]> {
    return (usersWorkersStorage.getJobs as any).apply(this, args);
  }

  getJob(...args: Parameters<IStorage["getJob"]>): ReturnType<IStorage["getJob"]> {
    return (usersWorkersStorage.getJob as any).apply(this, args);
  }

  createJob(...args: Parameters<IStorage["createJob"]>): ReturnType<IStorage["createJob"]> {
    return (usersWorkersStorage.createJob as any).apply(this, args);
  }

  getTransportRequests(...args: Parameters<IStorage["getTransportRequests"]>): ReturnType<IStorage["getTransportRequests"]> {
    return (usersWorkersStorage.getTransportRequests as any).apply(this, args);
  }

  createTransportRequest(...args: Parameters<IStorage["createTransportRequest"]>): ReturnType<IStorage["createTransportRequest"]> {
    return (usersWorkersStorage.createTransportRequest as any).apply(this, args);
  }

  getMessages(...args: Parameters<IStorage["getMessages"]>): ReturnType<IStorage["getMessages"]> {
    return (usersWorkersStorage.getMessages as any).apply(this, args);
  }

  createMessage(...args: Parameters<IStorage["createMessage"]>): ReturnType<IStorage["createMessage"]> {
    return (usersWorkersStorage.createMessage as any).apply(this, args);
  }

  getPricingTiers(...args: Parameters<IStorage["getPricingTiers"]>): ReturnType<IStorage["getPricingTiers"]> {
    return (billingStorage.getPricingTiers as any).apply(this, args);
  }

  calculateCareRate(...args: Parameters<IStorage["calculateCareRate"]>): ReturnType<IStorage["calculateCareRate"]> {
    return (billingStorage.calculateCareRate as any).apply(this, args);
  }

  calculateTransportRate(...args: Parameters<IStorage["calculateTransportRate"]>): ReturnType<IStorage["calculateTransportRate"]> {
    return (billingStorage.calculateTransportRate as any).apply(this, args);
  }

  createServiceSession(...args: Parameters<IStorage["createServiceSession"]>): ReturnType<IStorage["createServiceSession"]> {
    return (billingStorage.createServiceSession as any).apply(this, args);
  }

  getServiceSessions(...args: Parameters<IStorage["getServiceSessions"]>): ReturnType<IStorage["getServiceSessions"]> {
    return (billingStorage.getServiceSessions as any).apply(this, args);
  }

  createTransportTrip(...args: Parameters<IStorage["createTransportTrip"]>): ReturnType<IStorage["createTransportTrip"]> {
    return (billingStorage.createTransportTrip as any).apply(this, args);
  }

  getTransportTrips(...args: Parameters<IStorage["getTransportTrips"]>): ReturnType<IStorage["getTransportTrips"]> {
    return (billingStorage.getTransportTrips as any).apply(this, args);
  }

  createInvoice(...args: Parameters<IStorage["createInvoice"]>): ReturnType<IStorage["createInvoice"]> {
    return (billingStorage.createInvoice as any).apply(this, args);
  }

  getInvoices(...args: Parameters<IStorage["getInvoices"]>): ReturnType<IStorage["getInvoices"]> {
    return (billingStorage.getInvoices as any).apply(this, args);
  }

  generateInvoice(...args: Parameters<IStorage["generateInvoice"]>): ReturnType<IStorage["generateInvoice"]> {
    return (billingStorage.generateInvoice as any).apply(this, args);
  }

  getParticipantBudgets(...args: Parameters<IStorage["getParticipantBudgets"]>): ReturnType<IStorage["getParticipantBudgets"]> {
    return (billingStorage.getParticipantBudgets as any).apply(this, args);
  }

  updateBudgetUsage(...args: Parameters<IStorage["updateBudgetUsage"]>): ReturnType<IStorage["updateBudgetUsage"]> {
    return (billingStorage.updateBudgetUsage as any).apply(this, args);
  }

  createReview(...args: Parameters<IStorage["createReview"]>): ReturnType<IStorage["createReview"]> {
    return (billingStorage.createReview as any).apply(this, args);
  }

  getReviewsForWorker(...args: Parameters<IStorage["getReviewsForWorker"]>): ReturnType<IStorage["getReviewsForWorker"]> {
    return (billingStorage.getReviewsForWorker as any).apply(this, args);
  }

  getAccessProfile(...args: Parameters<IStorage["getAccessProfile"]>): ReturnType<IStorage["getAccessProfile"]> {
    return (billingStorage.getAccessProfile as any).apply(this, args);
  }

  upsertAccessProfile(...args: Parameters<IStorage["upsertAccessProfile"]>): ReturnType<IStorage["upsertAccessProfile"]> {
    return (billingStorage.upsertAccessProfile as any).apply(this, args);
  }

  getCommunityReports(...args: Parameters<IStorage["getCommunityReports"]>): ReturnType<IStorage["getCommunityReports"]> {
    return (billingStorage.getCommunityReports as any).apply(this, args);
  }

  createCommunityReport(...args: Parameters<IStorage["createCommunityReport"]>): ReturnType<IStorage["createCommunityReport"]> {
    return (billingStorage.createCommunityReport as any).apply(this, args);
  }

  updateUserStripeCustomerId(...args: Parameters<IStorage["updateUserStripeCustomerId"]>): ReturnType<IStorage["updateUserStripeCustomerId"]> {
    return (billingStorage.updateUserStripeCustomerId as any).apply(this, args);
  }

  updateUserOrbIds(...args: Parameters<IStorage["updateUserOrbIds"]>): ReturnType<IStorage["updateUserOrbIds"]> {
    return (billingStorage.updateUserOrbIds as any).apply(this, args);
  }

  getInvoiceById(...args: Parameters<IStorage["getInvoiceById"]>): ReturnType<IStorage["getInvoiceById"]> {
    return (billingStorage.getInvoiceById as any).apply(this, args);
  }

  updateInvoicePayment(...args: Parameters<IStorage["updateInvoicePayment"]>): ReturnType<IStorage["updateInvoicePayment"]> {
    return (billingStorage.updateInvoicePayment as any).apply(this, args);
  }

  getWorkerAvailability(...args: Parameters<IStorage["getWorkerAvailability"]>): ReturnType<IStorage["getWorkerAvailability"]> {
    return (schedulingStorage.getWorkerAvailability as any).apply(this, args);
  }

  getWorkerAvailabilityById(...args: Parameters<IStorage["getWorkerAvailabilityById"]>): ReturnType<IStorage["getWorkerAvailabilityById"]> {
    return (schedulingStorage.getWorkerAvailabilityById as any).apply(this, args);
  }

  createWorkerAvailability(...args: Parameters<IStorage["createWorkerAvailability"]>): ReturnType<IStorage["createWorkerAvailability"]> {
    return (schedulingStorage.createWorkerAvailability as any).apply(this, args);
  }

  deleteWorkerAvailability(...args: Parameters<IStorage["deleteWorkerAvailability"]>): ReturnType<IStorage["deleteWorkerAvailability"]> {
    return (schedulingStorage.deleteWorkerAvailability as any).apply(this, args);
  }

  setWorkerAvailabilityBulk(...args: Parameters<IStorage["setWorkerAvailabilityBulk"]>): ReturnType<IStorage["setWorkerAvailabilityBulk"]> {
    return (schedulingStorage.setWorkerAvailabilityBulk as any).apply(this, args);
  }

  getWorkerBlockouts(...args: Parameters<IStorage["getWorkerBlockouts"]>): ReturnType<IStorage["getWorkerBlockouts"]> {
    return (schedulingStorage.getWorkerBlockouts as any).apply(this, args);
  }

  getWorkerBlockoutById(...args: Parameters<IStorage["getWorkerBlockoutById"]>): ReturnType<IStorage["getWorkerBlockoutById"]> {
    return (schedulingStorage.getWorkerBlockoutById as any).apply(this, args);
  }

  createWorkerBlockout(...args: Parameters<IStorage["createWorkerBlockout"]>): ReturnType<IStorage["createWorkerBlockout"]> {
    return (schedulingStorage.createWorkerBlockout as any).apply(this, args);
  }

  deleteWorkerBlockout(...args: Parameters<IStorage["deleteWorkerBlockout"]>): ReturnType<IStorage["deleteWorkerBlockout"]> {
    return (schedulingStorage.deleteWorkerBlockout as any).apply(this, args);
  }

  getWorkerByUserId(...args: Parameters<IStorage["getWorkerByUserId"]>): ReturnType<IStorage["getWorkerByUserId"]> {
    return (schedulingStorage.getWorkerByUserId as any).apply(this, args);
  }

  updateWorkerAbnVerified(...args: Parameters<IStorage["updateWorkerAbnVerified"]>): ReturnType<IStorage["updateWorkerAbnVerified"]> {
    return (schedulingStorage.updateWorkerAbnVerified as any).apply(this, args);
  }

  getWorkersByIds(...args: Parameters<IStorage["getWorkersByIds"]>): ReturnType<IStorage["getWorkersByIds"]> {
    return (schedulingStorage.getWorkersByIds as any).apply(this, args);
  }

  getShifts(...args: Parameters<IStorage["getShifts"]>): ReturnType<IStorage["getShifts"]> {
    return (schedulingStorage.getShifts as any).apply(this, args);
  }

  getShift(...args: Parameters<IStorage["getShift"]>): ReturnType<IStorage["getShift"]> {
    return (schedulingStorage.getShift as any).apply(this, args);
  }

  createShift(...args: Parameters<IStorage["createShift"]>): ReturnType<IStorage["createShift"]> {
    return (schedulingStorage.createShift as any).apply(this, args);
  }

  updateShiftStatus(...args: Parameters<IStorage["updateShiftStatus"]>): ReturnType<IStorage["updateShiftStatus"]> {
    return (schedulingStorage.updateShiftStatus as any).apply(this, args);
  }

  deleteShift(...args: Parameters<IStorage["deleteShift"]>): ReturnType<IStorage["deleteShift"]> {
    return (schedulingStorage.deleteShift as any).apply(this, args);
  }

  getUpcomingShifts(...args: Parameters<IStorage["getUpcomingShifts"]>): ReturnType<IStorage["getUpcomingShifts"]> {
    return (schedulingStorage.getUpcomingShifts as any).apply(this, args);
  }

  getNdisPlanGoals(...args: Parameters<IStorage["getNdisPlanGoals"]>): ReturnType<IStorage["getNdisPlanGoals"]> {
    return (schedulingStorage.getNdisPlanGoals as any).apply(this, args);
  }

  getPendingInvoices(...args: Parameters<IStorage["getPendingInvoices"]>): ReturnType<IStorage["getPendingInvoices"]> {
    return (quickBooksStorage.getPendingInvoices as any).apply(this, args);
  }

  updateUserQbTokens(...args: Parameters<IStorage["updateUserQbTokens"]>): ReturnType<IStorage["updateUserQbTokens"]> {
    return (quickBooksStorage.updateUserQbTokens as any).apply(this, args);
  }

  clearUserQbTokens(...args: Parameters<IStorage["clearUserQbTokens"]>): ReturnType<IStorage["clearUserQbTokens"]> {
    return (quickBooksStorage.clearUserQbTokens as any).apply(this, args);
  }

  updateInvoiceQbSync(...args: Parameters<IStorage["updateInvoiceQbSync"]>): ReturnType<IStorage["updateInvoiceQbSync"]> {
    return (quickBooksStorage.updateInvoiceQbSync as any).apply(this, args);
  }

  getInvoicesByQbSyncStatus(...args: Parameters<IStorage["getInvoicesByQbSyncStatus"]>): ReturnType<IStorage["getInvoicesByQbSyncStatus"]> {
    return (quickBooksStorage.getInvoicesByQbSyncStatus as any).apply(this, args);
  }

  getAllInvoicesForSync(...args: Parameters<IStorage["getAllInvoicesForSync"]>): ReturnType<IStorage["getAllInvoicesForSync"]> {
    return (quickBooksStorage.getAllInvoicesForSync as any).apply(this, args);
  }

  getUsersByQbRealmId(...args: Parameters<IStorage["getUsersByQbRealmId"]>): ReturnType<IStorage["getUsersByQbRealmId"]> {
    return (quickBooksStorage.getUsersByQbRealmId as any).apply(this, args);
  }

  getQbConnectedUsers(...args: Parameters<IStorage["getQbConnectedUsers"]>): ReturnType<IStorage["getQbConnectedUsers"]> {
    return (quickBooksStorage.getQbConnectedUsers as any).apply(this, args);
  }

  getGroceryProducts(...args: Parameters<IStorage["getGroceryProducts"]>): ReturnType<IStorage["getGroceryProducts"]> {
    return (groceryStorage.getGroceryProducts as any).apply(this, args);
  }

  getGroceryProduct(...args: Parameters<IStorage["getGroceryProduct"]>): ReturnType<IStorage["getGroceryProduct"]> {
    return (groceryStorage.getGroceryProduct as any).apply(this, args);
  }

  createGroceryProduct(...args: Parameters<IStorage["createGroceryProduct"]>): ReturnType<IStorage["createGroceryProduct"]> {
    return (groceryStorage.createGroceryProduct as any).apply(this, args);
  }

  upsertSupplierGroceryProduct(...args: Parameters<IStorage["upsertSupplierGroceryProduct"]>): ReturnType<IStorage["upsertSupplierGroceryProduct"]> {
    return (groceryStorage.upsertSupplierGroceryProduct as any).apply(this, args);
  }

  deleteGroceryProductsBySource(...args: Parameters<IStorage["deleteGroceryProductsBySource"]>): ReturnType<IStorage["deleteGroceryProductsBySource"]> {
    return (groceryStorage.deleteGroceryProductsBySource as any).apply(this, args);
  }

  getGroceryCatalogStatus(...args: Parameters<IStorage["getGroceryCatalogStatus"]>): ReturnType<IStorage["getGroceryCatalogStatus"]> {
    return (groceryStorage.getGroceryCatalogStatus as any).apply(this, args);
  }

  createGroceryOrder(...args: Parameters<IStorage["createGroceryOrder"]>): ReturnType<IStorage["createGroceryOrder"]> {
    return (groceryStorage.createGroceryOrder as any).apply(this, args);
  }

  getGroceryOrders(...args: Parameters<IStorage["getGroceryOrders"]>): ReturnType<IStorage["getGroceryOrders"]> {
    return (groceryStorage.getGroceryOrders as any).apply(this, args);
  }

  getGroceryOrder(...args: Parameters<IStorage["getGroceryOrder"]>): ReturnType<IStorage["getGroceryOrder"]> {
    return (groceryStorage.getGroceryOrder as any).apply(this, args);
  }

  updateGroceryOrderStatus(...args: Parameters<IStorage["updateGroceryOrderStatus"]>): ReturnType<IStorage["updateGroceryOrderStatus"]> {
    return (groceryStorage.updateGroceryOrderStatus as any).apply(this, args);
  }

  updateGroceryOrderPayment(...args: Parameters<IStorage["updateGroceryOrderPayment"]>): ReturnType<IStorage["updateGroceryOrderPayment"]> {
    return (groceryStorage.updateGroceryOrderPayment as any).apply(this, args);
  }

  getActiveGroceryOrders(...args: Parameters<IStorage["getActiveGroceryOrders"]>): ReturnType<IStorage["getActiveGroceryOrders"]> {
    return (groceryStorage.getActiveGroceryOrders as any).apply(this, args);
  }

  deleteGroceryOrder(...args: Parameters<IStorage["deleteGroceryOrder"]>): ReturnType<IStorage["deleteGroceryOrder"]> {
    return (groceryStorage.deleteGroceryOrder as any).apply(this, args);
  }

  createBecsMandate(...a: Parameters<IStorage["createBecsMandate"]>) { return (paymentsStorage.createBecsMandate as any).apply(this, a); }
  getBecsMandates(...a: Parameters<IStorage["getBecsMandates"]>) { return (paymentsStorage.getBecsMandates as any).apply(this, a); }
  getBecsMandate(...a: Parameters<IStorage["getBecsMandate"]>) { return (paymentsStorage.getBecsMandate as any).apply(this, a); }
  getBecsMandateByPaymentMethod(...a: Parameters<IStorage["getBecsMandateByPaymentMethod"]>) { return (paymentsStorage.getBecsMandateByPaymentMethod as any).apply(this, a); }
  updateBecsMandateStatus(...a: Parameters<IStorage["updateBecsMandateStatus"]>) { return (paymentsStorage.updateBecsMandateStatus as any).apply(this, a); }
  deleteBecsMandate(...a: Parameters<IStorage["deleteBecsMandate"]>) { return (paymentsStorage.deleteBecsMandate as any).apply(this, a); }
  setDefaultBecsMandate(...a: Parameters<IStorage["setDefaultBecsMandate"]>) { return (paymentsStorage.setDefaultBecsMandate as any).apply(this, a); }
  getDefaultBecsMandate(...a: Parameters<IStorage["getDefaultBecsMandate"]>) { return (paymentsStorage.getDefaultBecsMandate as any).apply(this, a); }
  setUserAutoDebit(...a: Parameters<IStorage["setUserAutoDebit"]>) { return (paymentsStorage.setUserAutoDebit as any).apply(this, a); }
  setStripeAccount(...a: Parameters<IStorage["setStripeAccount"]>) { return (paymentsStorage.setStripeAccount as any).apply(this, a); }
  getUserByStripeAccountId(...a: Parameters<IStorage["getUserByStripeAccountId"]>) { return (paymentsStorage.getUserByStripeAccountId as any).apply(this, a); }
  getUserByStripeCustomerId(...a: Parameters<IStorage["getUserByStripeCustomerId"]>) { return (paymentsStorage.getUserByStripeCustomerId as any).apply(this, a); }
  createNdisClaim(...a: Parameters<IStorage["createNdisClaim"]>) { return (paymentsStorage.createNdisClaim as any).apply(this, a); }
  getNdisClaims(...a: Parameters<IStorage["getNdisClaims"]>) { return (paymentsStorage.getNdisClaims as any).apply(this, a); }
  wasWebhookProcessed(...a: Parameters<IStorage["wasWebhookProcessed"]>) { return (paymentsStorage.wasWebhookProcessed as any).apply(this, a); }
  recordWebhookEvent(...a: Parameters<IStorage["recordWebhookEvent"]>) { return (paymentsStorage.recordWebhookEvent as any).apply(this, a); }
  claimWebhookEvent(...a: Parameters<IStorage["claimWebhookEvent"]>) { return (paymentsStorage.claimWebhookEvent as any).apply(this, a); }
  releaseWebhookEvent(...a: Parameters<IStorage["releaseWebhookEvent"]>) { return (paymentsStorage.releaseWebhookEvent as any).apply(this, a); }
  getInvoicesAwaitingAutoDebit(...a: Parameters<IStorage["getInvoicesAwaitingAutoDebit"]>) { return (paymentsStorage.getInvoicesAwaitingAutoDebit as any).apply(this, a); }
  recordPayoutEvent(...a: Parameters<IStorage["recordPayoutEvent"]>) { return (paymentsStorage.recordPayoutEvent as any).apply(this, a); }
  listPayoutEvents(...a: Parameters<IStorage["listPayoutEvents"]>) { return (paymentsStorage.listPayoutEvents as any).apply(this, a); }
}

export const storage = new DatabaseStorage();

export { geoStorage } from "./geo";
