import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, boolean, timestamp, decimal, pgEnum, jsonb, json, serial, uuid } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  
  import { shiftStatusEnum } from "./common";

  export const workerAvailability = pgTable("worker_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isRecurring: boolean("is_recurring").default(true),
});

export const workerBlockouts = pgTable("worker_blockouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull(),
  date: text("date").notNull(),
  reason: text("reason"),
});

export const shifts = pgTable("shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull(),
  workerId: varchar("worker_id").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  ndisGoal: text("ndis_goal"),
  ndisCategory: text("ndis_category"),
  status: shiftStatusEnum("status").notNull().default("scheduled"),
  recurrenceRule: text("recurrence_rule"),
  notes: text("notes"),
  serviceSessionId: varchar("service_session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ndisPlanCache = pgTable("ndis_plan_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").notNull(),
  planData: jsonb("plan_data"),
  goals: jsonb("goals").$type<{ id: string; name: string; category: string; budget: number }[]>(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
});

export const insertWorkerAvailabilitySchema = createInsertSchema(workerAvailability).omit({
  id: true,
});

export const insertWorkerBlockoutSchema = createInsertSchema(workerBlockouts).omit({
  id: true,
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
});

export const insertNdisPlanCacheSchema = createInsertSchema(ndisPlanCache).omit({
  id: true,
  fetchedAt: true,
});

export type InsertWorkerAvailability = z.infer<typeof insertWorkerAvailabilitySchema>;
export type WorkerAvailability = typeof workerAvailability.$inferSelect;
export type InsertWorkerBlockout = z.infer<typeof insertWorkerBlockoutSchema>;
export type WorkerBlockout = typeof workerBlockouts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shifts.$inferSelect;
export type InsertNdisPlanCache = z.infer<typeof insertNdisPlanCacheSchema>;
export type NdisPlanCache = typeof ndisPlanCache.$inferSelect;
  