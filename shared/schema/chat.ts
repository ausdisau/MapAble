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

export const chatGuardrailAuditLogs = pgTable("chat_guardrail_audit_logs", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  input: text("input").notNull(),
  output: text("output"),
  toolCalls: jsonb("tool_calls").$type<string[]>().default([]),
  classifierVerdicts: jsonb("classifier_verdicts").$type<string[]>().default([]),
  guardrailActions: jsonb("guardrail_actions").$type<string[]>().default([]),
  policyRefs: jsonb("policy_refs").$type<string[]>().default([]),
  policyPackVersion: text("policy_pack_version").notNull(),
  flaggedForReview: boolean("flagged_for_review").notNull().default(false),
  retentionUntil: timestamp("retention_until"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const safeguardingIncidentDrafts = pgTable("safeguarding_incident_drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  incidentType: text("incident_type").notNull(),
  immediateActions: text("immediate_actions").notNull(),
  reportable: boolean("reportable").notNull().default(false),
  lodged24h: boolean("lodged_24h").notNull().default(false),
  lodged5day: boolean("lodged_5day").notNull().default(false),
  investigationSummary: text("investigation_summary"),
  correctiveActions: text("corrective_actions"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const safeguardingComplaintDrafts = pgTable("safeguarding_complaint_drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  issue: text("issue").notNull(),
  raisedBy: text("raised_by").notNull().default("participant"),
  acknowledgedAt: timestamp("acknowledged_at"),
  outcome: text("outcome"),
  appeal: boolean("appeal").notNull().default(false),
  improvementsLogged: text("improvements_logged"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const safeguardingConsentRecords = pgTable("safeguarding_consent_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  subject: text("subject").notNull(),
  scope: text("scope").notNull(),
  granted: boolean("granted").notNull(),
  evidence: text("evidence"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const safeguardingConcernFlags = pgTable("safeguarding_concern_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  concernType: text("concern_type").notNull(),
  summary: text("summary").notNull(),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("needs_review"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatHandoffs = pgTable("chat_handoffs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("requested"),
  channel: text("channel").default("web"),
  assignedTo: varchar("assigned_to"),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const insertChatGuardrailAuditLogSchema = createInsertSchema(chatGuardrailAuditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSafeguardingIncidentDraftSchema = createInsertSchema(safeguardingIncidentDrafts).omit({
  id: true,
  createdAt: true,
});

export const insertSafeguardingComplaintDraftSchema = createInsertSchema(safeguardingComplaintDrafts).omit({
  id: true,
  createdAt: true,
});

export const insertSafeguardingConsentRecordSchema = createInsertSchema(safeguardingConsentRecords).omit({
  id: true,
  createdAt: true,
});

export const insertSafeguardingConcernFlagSchema = createInsertSchema(safeguardingConcernFlags).omit({
  id: true,
  createdAt: true,
});

export const insertChatHandoffSchema = createInsertSchema(chatHandoffs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export type InsertChatGuardrailAuditLog = z.infer<typeof insertChatGuardrailAuditLogSchema>;
export type ChatGuardrailAuditLog = typeof chatGuardrailAuditLogs.$inferSelect;
export type InsertSafeguardingIncidentDraft = z.infer<typeof insertSafeguardingIncidentDraftSchema>;
export type SafeguardingIncidentDraft = typeof safeguardingIncidentDrafts.$inferSelect;
export type InsertSafeguardingComplaintDraft = z.infer<typeof insertSafeguardingComplaintDraftSchema>;
export type SafeguardingComplaintDraft = typeof safeguardingComplaintDrafts.$inferSelect;
export type InsertSafeguardingConsentRecord = z.infer<typeof insertSafeguardingConsentRecordSchema>;
export type SafeguardingConsentRecord = typeof safeguardingConsentRecords.$inferSelect;
export type InsertSafeguardingConcernFlag = z.infer<typeof insertSafeguardingConcernFlagSchema>;
export type SafeguardingConcernFlag = typeof safeguardingConcernFlags.$inferSelect;
export type InsertChatHandoff = z.infer<typeof insertChatHandoffSchema>;
export type ChatHandoff = typeof chatHandoffs.$inferSelect;
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
  