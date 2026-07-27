import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { communityReports } from "@shared/schema";
import type { ChatModule } from "../types";

const BARRIER_TYPES = [
  "lift_out",
  "ramp_blocked",
  "path_closed",
  "door_too_heavy",
  "kerb_ramp_missing",
  "inaccessible_toilet",
  "unsafe_crossing",
  "driver_bypass",
  "helpful_staff",
  "other",
] as const;

const SEVERITIES = ["low", "medium", "high", "critical"] as const;

function reportSummary(r: any) {
  return {
    reportId: r.id,
    barrierType: r.barrierType,
    severity: r.severity,
    location: r.locationRef,
    description: r.description,
    status: r.moderationStatus,
    reportedAt: r.createdAt,
  };
}

export const barriersModule: ChatModule = {
  name: "barriers",
  description: "Checks community-reported accessibility barriers, lists the user's own reports, and submits or edits barrier reports.",
  intents: ["barrier", "blocked", "broken", "out of order", "closed", "lift", "ramp", "kerb", "curb", "path", "access", "obstacle", "report", "edit", "update", "change", "my reports"],
  quickActions: ["report_barrier", "edit_barrier_report"],
  tools: [
    {
      type: "function",
      function: {
        name: "check_barrier_reports",
        description: "Check community-reported accessibility barriers at a specific location or area.",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string", description: "Location or area to check for barrier reports" },
          },
          required: ["location"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "list_my_barrier_reports",
        description: "List the barrier reports the current user has submitted, so they can choose one to edit. Returns each report's id, type, severity, location and description.",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
    {
      type: "function",
      function: {
        name: "submit_barrier_report",
        description:
          "Submit a NEW community barrier report. Gather all required fields one at a time, then read them back and get the user's explicit confirmation. Call with confirmed omitted/false to get a read-back; call with confirmed=true only after the user agrees, to perform the write.",
        parameters: {
          type: "object",
          properties: {
            locationRef: { type: "string", description: "Location where the barrier is" },
            barrierType: { type: "string", enum: [...BARRIER_TYPES], description: "Type of accessibility barrier" },
            severity: { type: "string", enum: [...SEVERITIES], description: "Severity of the barrier" },
            description: { type: "string", description: "Detailed description of the barrier" },
            confirmed: { type: "boolean", description: "Set true ONLY after the user has explicitly confirmed submission." },
          },
          required: ["locationRef", "barrierType", "severity"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "update_barrier_report",
        description:
          "Update an existing barrier report owned by the current user. First call list_my_barrier_reports to find the reportId, then read current values back and get explicit confirmation. Call with confirmed omitted/false to get a read-back; call with confirmed=true only after the user agrees.",
        parameters: {
          type: "object",
          properties: {
            reportId: { type: "string", description: "The id of the report to update (from list_my_barrier_reports)." },
            locationRef: { type: "string", description: "New location reference." },
            barrierType: { type: "string", enum: [...BARRIER_TYPES], description: "New barrier type." },
            severity: { type: "string", enum: [...SEVERITIES], description: "New severity." },
            description: { type: "string", description: "New description." },
            confirmed: { type: "boolean", description: "Set true ONLY after the user has explicitly confirmed the change." },
          },
          required: ["reportId"],
        },
      },
    },
  ],
  handlers: {
    check_barrier_reports: async (args, ctx) => {
      const reports = await ctx.db
        .select()
        .from(communityReports)
        .where(eq(communityReports.moderationStatus, "unverified"))
        .orderBy(desc(communityReports.createdAt))
        .limit(10);

      const locationLower = (args.location || "").toLowerCase();
      const relevant = reports.filter((r) =>
        r.locationRef.toLowerCase().includes(locationLower)
      );

      if (relevant.length === 0) {
        return JSON.stringify({
          message: `No barrier reports found for "${args.location}". This could mean the area is accessible or no reports have been submitted yet.`,
          confidence: "low — no community data available",
        });
      }

      return JSON.stringify({
        reports: relevant.map((r) => ({
          type: r.barrierType,
          severity: r.severity,
          location: r.locationRef,
          description: r.description,
          reportedAt: r.createdAt,
          status: r.moderationStatus,
        })),
        confidence: "medium — based on community reports",
      });
    },

    list_my_barrier_reports: async (_args, ctx) => {
      const reports = await ctx.storage.getCommunityReportsByReporter(ctx.userId);
      if (reports.length === 0) {
        return JSON.stringify({
          reports: [],
          message: "The user has not submitted any barrier reports yet.",
        });
      }
      return JSON.stringify({ reports: reports.map(reportSummary) });
    },

    submit_barrier_report: async (args, ctx) => {
      const schema = z.object({
        locationRef: z.string().min(1, "A location is required."),
        barrierType: z.enum(BARRIER_TYPES),
        severity: z.enum(SEVERITIES),
        description: z.string().optional(),
      });
      const parsed = schema.safeParse(args);
      if (!parsed.success) {
        return JSON.stringify({
          success: false,
          validationErrors: parsed.error.errors.map((e) => `${e.path.join(".") || "value"}: ${e.message}`),
          message: "Some values weren't valid. Explain the issues to the user in plain language and ask them to correct.",
        });
      }
      const fields = parsed.data;

      if (!args.confirmed) {
        return JSON.stringify({
          success: false,
          needsConfirmation: true,
          proposed: {
            location: fields.locationRef,
            barrierType: fields.barrierType,
            severity: fields.severity,
            description: fields.description || null,
          },
          message: "Read this report back to the user and ask them to confirm before submitting. Re-call submit_barrier_report with confirmed=true once they agree.",
        });
      }

      const [report] = await ctx.db
        .insert(communityReports)
        .values({
          reporterUserId: ctx.userId,
          locationRef: fields.locationRef,
          barrierType: fields.barrierType,
          severity: fields.severity,
          description: fields.description || null,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .returning();

      return JSON.stringify({
        success: true,
        report: reportSummary(report),
        message: `Barrier report submitted for ${fields.locationRef}. Thank you for helping improve accessibility information for the community.`,
      });
    },

    update_barrier_report: async (args, ctx) => {
      const schema = z.object({
        reportId: z.string().min(1, "A report id is required."),
        locationRef: z.string().min(1).optional(),
        barrierType: z.enum(BARRIER_TYPES).optional(),
        severity: z.enum(SEVERITIES).optional(),
        description: z.string().optional(),
      });
      const parsed = schema.safeParse(args);
      if (!parsed.success) {
        return JSON.stringify({
          success: false,
          validationErrors: parsed.error.errors.map((e) => `${e.path.join(".") || "value"}: ${e.message}`),
          message: "Some values weren't valid. Explain the issues to the user in plain language and ask them to correct.",
        });
      }
      const { reportId, ...rest } = parsed.data;

      const reports = await ctx.storage.getCommunityReportsByReporter(ctx.userId);
      const existing = reports.find((r) => r.id === reportId);
      if (!existing) {
        return JSON.stringify({
          success: false,
          message: "Couldn't find a barrier report with that id belonging to this user. Call list_my_barrier_reports to show the user their reports.",
        });
      }

      const changes: Record<string, any> = {};
      if (rest.locationRef !== undefined) changes.locationRef = rest.locationRef;
      if (rest.barrierType !== undefined) changes.barrierType = rest.barrierType;
      if (rest.severity !== undefined) changes.severity = rest.severity;
      if (rest.description !== undefined) changes.description = rest.description || null;

      if (Object.keys(changes).length === 0) {
        return JSON.stringify({
          success: false,
          message: "No fields were provided to change. Ask the user what they'd like to update on this report.",
          current: reportSummary(existing),
        });
      }

      if (!args.confirmed) {
        return JSON.stringify({
          success: false,
          needsConfirmation: true,
          current: reportSummary(existing),
          proposed: changes,
          message: "Read these current vs proposed values back to the user and ask them to confirm. Re-call update_barrier_report with confirmed=true once they agree.",
        });
      }

      const updated = await ctx.storage.updateCommunityReport(reportId, ctx.userId, changes);
      if (!updated) {
        return JSON.stringify({ success: false, message: "The update could not be applied. The report may no longer exist." });
      }

      return JSON.stringify({
        success: true,
        report: reportSummary(updated),
        message: "Barrier report updated. Confirm the new state to the user.",
      });
    },
  },
};
