import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, boolean, timestamp, decimal, pgEnum, jsonb, json, serial, uuid } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  
  import { bookingStatusEnum, jobStatusEnum, transportStatusEnum } from "./common";

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
  export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertTransportRequest = z.infer<typeof insertTransportRequestSchema>;
export type TransportRequest = typeof transportRequests.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
  