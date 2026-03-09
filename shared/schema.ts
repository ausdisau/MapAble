import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["participant", "carer", "provider", "admin"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "in_progress", "completed", "cancelled"]);
export const jobStatusEnum = pgEnum("job_status", ["open", "applied", "interviewing", "filled", "closed"]);
export const transportStatusEnum = pgEnum("transport_status", ["requested", "accepted", "in_transit", "completed", "cancelled"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "submitted", "paid"]);
export const sessionStatusEnum = pgEnum("session_status", ["in_progress", "completed", "cancelled"]);
export const budgetCategoryEnum = pgEnum("budget_category", ["daily_living", "transport", "capacity_building"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull().default("participant"),
  location: text("location"),
  bio: text("bio"),
  avatar: text("avatar"),
  isVerified: boolean("is_verified").default(false),
  accessNeeds: text("access_needs").array(),
  languages: text("languages").array(),
  skills: text("skills").array(),
  ndisNumber: text("ndis_number"),
  planStartDate: text("plan_start_date"),
  planEndDate: text("plan_end_date"),
  phoneNumber: text("phone_number"),
});

export const workers = pgTable("workers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  specializations: text("specializations").array(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  transportCapable: boolean("transport_capable").default(false),
  transportType: text("transport_type"),
  wheelchairAccessible: boolean("wheelchair_accessible").default(false),
  ndisVerified: boolean("ndis_verified").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  availability: text("availability"),
  photo: text("photo"),
  abn: text("abn"),
  insuranceExpiry: text("insurance_expiry"),
  firstAidExpiry: text("first_aid_expiry"),
  wwccNumber: text("wwcc_number"),
  wwccExpiry: text("wwcc_expiry"),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull(),
  workerId: varchar("worker_id").notNull(),
  serviceType: text("service_type").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  status: bookingStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
});

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postedBy: varchar("posted_by").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  jobType: text("job_type").notNull(),
  salary: text("salary"),
  requirements: text("requirements").array(),
  status: jobStatusEnum("status").notNull().default("open"),
  category: text("category").notNull(),
});

export const transportRequests = pgTable("transport_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull(),
  workerId: varchar("worker_id"),
  pickupLocation: text("pickup_location").notNull(),
  dropoffLocation: text("dropoff_location").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  wheelchairRequired: boolean("wheelchair_required").default(false),
  status: transportStatusEnum("status").notNull().default("requested"),
  notes: text("notes"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  body: text("body").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  read: boolean("read").default(false),
});

export const pricingTiers = pgTable("pricing_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceType: text("service_type").notNull(),
  tierName: text("tier_name").notNull(),
  minUsage: decimal("min_usage", { precision: 10, scale: 2 }).notNull(),
  maxUsage: decimal("max_usage", { precision: 10, scale: 2 }),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  ndisCategory: text("ndis_category").notNull(),
  ndisItemCode: text("ndis_item_code"),
  description: text("description"),
});

export const serviceSessions = pgTable("service_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id"),
  workerId: varchar("worker_id").notNull(),
  participantId: varchar("participant_id").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  actualHours: decimal("actual_hours", { precision: 10, scale: 2 }),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  tierApplied: text("tier_applied"),
  ndisItemCode: text("ndis_item_code"),
  totalCharge: decimal("total_charge", { precision: 10, scale: 2 }),
  shiftNotes: text("shift_notes"),
  status: sessionStatusEnum("status").notNull().default("in_progress"),
  date: text("date").notNull(),
});

export const transportTrips = pgTable("transport_trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transportRequestId: varchar("transport_request_id"),
  workerId: varchar("worker_id").notNull(),
  participantId: varchar("participant_id").notNull(),
  distanceKm: decimal("distance_km", { precision: 10, scale: 2 }),
  perKmRate: decimal("per_km_rate", { precision: 10, scale: 2 }),
  tierApplied: text("tier_applied"),
  accessibleVehicle: boolean("accessible_vehicle").default(false),
  accessibleSurcharge: decimal("accessible_surcharge", { precision: 10, scale: 2 }).default("0"),
  tolls: decimal("tolls", { precision: 10, scale: 2 }).default("0"),
  totalCharge: decimal("total_charge", { precision: 10, scale: 2 }),
  ndisItemCode: text("ndis_item_code"),
  status: sessionStatusEnum("status").notNull().default("in_progress"),
  date: text("date").notNull(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull(),
  providerId: varchar("provider_id"),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  ndisClaimable: decimal("ndis_claimable", { precision: 10, scale: 2 }),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  lineItems: jsonb("line_items"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull(),
  workerId: varchar("worker_id").notNull(),
  bookingId: varchar("booking_id"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const participantBudgets = pgTable("participant_budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull(),
  category: budgetCategoryEnum("category").notNull(),
  totalAllocated: decimal("total_allocated", { precision: 10, scale: 2 }).notNull(),
  totalUsed: decimal("total_used", { precision: 10, scale: 2 }).notNull().default("0"),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  role: true,
  location: true,
  bio: true,
  avatar: true,
  accessNeeds: true,
  languages: true,
  skills: true,
  ndisNumber: true,
  planStartDate: true,
  planEndDate: true,
  phoneNumber: true,
});

export const insertWorkerSchema = createInsertSchema(workers).pick({
  userId: true,
  title: true,
  specializations: true,
  hourlyRate: true,
  transportCapable: true,
  transportType: true,
  wheelchairAccessible: true,
  ndisVerified: true,
  availability: true,
  photo: true,
  abn: true,
  insuranceExpiry: true,
  firstAidExpiry: true,
  wwccNumber: true,
  wwccExpiry: true,
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  participantId: true,
  workerId: true,
  serviceType: true,
  date: true,
  startTime: true,
  endTime: true,
  notes: true,
  totalCost: true,
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  postedBy: true,
  title: true,
  description: true,
  location: true,
  jobType: true,
  salary: true,
  requirements: true,
  category: true,
});

export const insertTransportRequestSchema = createInsertSchema(transportRequests).pick({
  participantId: true,
  pickupLocation: true,
  dropoffLocation: true,
  date: true,
  time: true,
  wheelchairRequired: true,
  notes: true,
  estimatedCost: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  body: true,
});

export const insertPricingTierSchema = createInsertSchema(pricingTiers).pick({
  serviceType: true,
  tierName: true,
  minUsage: true,
  maxUsage: true,
  rate: true,
  ndisCategory: true,
  ndisItemCode: true,
  description: true,
});

export const insertServiceSessionSchema = createInsertSchema(serviceSessions).pick({
  bookingId: true,
  workerId: true,
  participantId: true,
  startTime: true,
  endTime: true,
  actualHours: true,
  hourlyRate: true,
  tierApplied: true,
  ndisItemCode: true,
  totalCharge: true,
  shiftNotes: true,
  date: true,
});

export const insertTransportTripSchema = createInsertSchema(transportTrips).pick({
  transportRequestId: true,
  workerId: true,
  participantId: true,
  distanceKm: true,
  perKmRate: true,
  tierApplied: true,
  accessibleVehicle: true,
  accessibleSurcharge: true,
  tolls: true,
  totalCharge: true,
  ndisItemCode: true,
  date: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  participantId: true,
  providerId: true,
  periodStart: true,
  periodEnd: true,
  totalAmount: true,
  ndisClaimable: true,
  lineItems: true,
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  participantId: true,
  workerId: true,
  bookingId: true,
  rating: true,
  comment: true,
});

export const insertParticipantBudgetSchema = createInsertSchema(participantBudgets).pick({
  participantId: true,
  category: true,
  totalAllocated: true,
  totalUsed: true,
  periodStart: true,
  periodEnd: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type Worker = typeof workers.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertTransportRequest = z.infer<typeof insertTransportRequestSchema>;
export type TransportRequest = typeof transportRequests.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertPricingTier = z.infer<typeof insertPricingTierSchema>;
export type PricingTier = typeof pricingTiers.$inferSelect;
export type InsertServiceSession = z.infer<typeof insertServiceSessionSchema>;
export type ServiceSession = typeof serviceSessions.$inferSelect;
export type InsertTransportTrip = z.infer<typeof insertTransportTripSchema>;
export type TransportTrip = typeof transportTrips.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertParticipantBudget = z.infer<typeof insertParticipantBudgetSchema>;
export type ParticipantBudget = typeof participantBudgets.$inferSelect;
