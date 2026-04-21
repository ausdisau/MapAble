import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, boolean, timestamp, decimal, pgEnum, jsonb, json, serial, uuid } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  
  export const userRoleEnum = pgEnum("user_role", ["participant", "carer", "provider", "admin"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "in_progress", "completed", "cancelled"]);
export const jobStatusEnum = pgEnum("job_status", ["open", "applied", "interviewing", "filled", "closed"]);
export const transportStatusEnum = pgEnum("transport_status", ["requested", "accepted", "in_transit", "completed", "cancelled"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "submitted", "pending", "processing", "paid", "failed"]);
export const sessionStatusEnum = pgEnum("session_status", ["in_progress", "completed", "cancelled"]);
export const budgetCategoryEnum = pgEnum("budget_category", ["daily_living", "transport", "capacity_building"]);
  export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
  id: uuid("id"),
  userId: uuid("userId"),
  expiresAt: timestamp("expiresAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }),
  updatedAt: timestamp("updatedAt", { withTimezone: true }),
  activeOrganizationId: text("activeOrganizationId"),
  token: text("token"),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  impersonatedBy: text("impersonatedBy"),
});

export const moderationStatusEnum = pgEnum("moderation_status", ["unverified", "verified", "rejected", "expired"]);
export const barrierTypeEnum = pgEnum("barrier_type", ["lift_out", "ramp_blocked", "path_closed", "door_too_heavy", "kerb_ramp_missing", "inaccessible_toilet", "unsafe_crossing", "driver_bypass", "helpful_staff", "other"]);
export const barrierSeverityEnum = pgEnum("barrier_severity", ["low", "medium", "high", "critical"]);
  export const shiftStatusEnum = pgEnum("shift_status", ["scheduled", "confirmed", "in_progress", "completed", "cancelled"]);
  