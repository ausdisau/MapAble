import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["participant", "carer", "provider", "admin"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "in_progress", "completed", "cancelled"]);
export const jobStatusEnum = pgEnum("job_status", ["open", "applied", "interviewing", "filled", "closed"]);
export const transportStatusEnum = pgEnum("transport_status", ["requested", "accepted", "in_transit", "completed", "cancelled"]);

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
