import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, boolean, timestamp, decimal, pgEnum, jsonb, json, serial, uuid } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  
  import { invoiceStatusEnum, sessionStatusEnum, budgetCategoryEnum } from "./common";

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
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).default("0"),
  totalIncGst: decimal("total_inc_gst", { precision: 10, scale: 2 }),
  ndisClaimable: decimal("ndis_claimable", { precision: 10, scale: 2 }),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  lineItems: jsonb("line_items"),
  generatedAt: timestamp("generated_at").defaultNow(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripePaymentStatus: text("stripe_payment_status"),
  qbInvoiceId: text("qb_invoice_id"),
  qbSyncStatus: text("qb_sync_status"),
  qbSyncError: text("qb_sync_error"),
  qbLastSyncedAt: timestamp("qb_last_synced_at"),
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

export const becsMandates = pgTable("becs_mandates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  stripePaymentMethodId: text("stripe_payment_method_id").notNull(),
  stripeMandateId: text("stripe_mandate_id"),
  bsbLast4: text("bsb_last4"),
  accountLast4: text("account_last4"),
  bankName: text("bank_name"),
  status: text("status").notNull().default("pending"),
  mandateUrl: text("mandate_url"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ndisClaims = pgTable("ndis_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id"),
  serviceSessionId: varchar("service_session_id"),
  participantId: varchar("participant_id").notNull(),
  providerId: varchar("provider_id"),
  prodaClaimId: text("proda_claim_id"),
  claimReference: text("claim_reference").notNull(),
  itemCode: text("item_code").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  serviceDate: text("service_date").notNull(),
  status: text("status").notNull().default("submitted"),
  statusMessage: text("status_message"),
  rejectionReason: text("rejection_reason"),
  requestPayload: jsonb("request_payload"),
  responsePayload: jsonb("response_payload"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: text("event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  receivedAt: timestamp("received_at").defaultNow(),
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
  status: true,
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
  status: true,
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

export const insertBecsMandateSchema = createInsertSchema(becsMandates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBecsMandate = z.infer<typeof insertBecsMandateSchema>;
export type BecsMandate = typeof becsMandates.$inferSelect;

export const insertNdisClaimSchema = createInsertSchema(ndisClaims).omit({
  id: true,
  submittedAt: true,
  updatedAt: true,
});
export type InsertNdisClaim = z.infer<typeof insertNdisClaimSchema>;
export type NdisClaim = typeof ndisClaims.$inferSelect;

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
