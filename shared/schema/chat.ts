import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, boolean, timestamp, decimal, pgEnum, jsonb, json, serial, uuid } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  
  import { moderationStatusEnum, barrierTypeEnum, barrierSeverityEnum } from "./common";

  export const accessContextProfiles = pgTable("access_context_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  mobilityAids: jsonb("mobility_aids").$type<string[]>().default([]),
  maxTransferM: integer("max_transfer_m").default(200),
  stairsAllowed: boolean("stairs_allowed").default(true),
  sensoryPreferences: jsonb("sensory_preferences").$type<{
    noiseSensitivity?: string;
    crowdSensitivity?: string;
    lightingSensitivity?: string;
    fewerInterchanges?: boolean;
  }>().default({}),
  communicationMode: text("communication_mode").default("text"),
  assistancePreferences: jsonb("assistance_preferences").$type<{
    needsStaffAssistance?: boolean;
    canTravelAlone?: boolean;
    emergencyContact?: string;
  }>().default({}),
  consentScopes: jsonb("consent_scopes").$type<Record<string, boolean>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").default("New conversation"),
  channel: text("channel").default("web"),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  toolCalls: jsonb("tool_calls"),
  quickActions: jsonb("quick_actions").$type<string[]>(),
  confidence: text("confidence"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityReports = pgTable("community_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterUserId: varchar("reporter_user_id"),
  locationRef: text("location_ref").notNull(),
  barrierType: barrierTypeEnum("barrier_type").notNull(),
  severity: barrierSeverityEnum("severity").notNull().default("medium"),
  description: text("description"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  moderationStatus: moderationStatusEnum("moderation_status").notNull().default("unverified"),
  confidenceWeight: decimal("confidence_weight", { precision: 3, scale: 2 }).default("0.5"),
});

export const insertAccessContextProfileSchema = createInsertSchema(accessContextProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  startedAt: true,
  endedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertCommunityReportSchema = createInsertSchema(communityReports).omit({
  id: true,
  createdAt: true,
  moderationStatus: true,
  confidenceWeight: true,
});

export type InsertAccessContextProfile = z.infer<typeof insertAccessContextProfileSchema>;
export type AccessContextProfile = typeof accessContextProfiles.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertCommunityReport = z.infer<typeof insertCommunityReportSchema>;
export type CommunityReport = typeof communityReports.$inferSelect;
  export const userEmailInboxes = pgTable("user_email_inboxes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  inboxId: varchar("inbox_id").notNull().unique(),
  email: varchar("email").notNull(),
  displayName: varchar("display_name"),
  createdAt: timestamp("created_at").defaultNow(),
});
  