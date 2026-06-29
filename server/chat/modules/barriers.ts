import { desc, eq } from "drizzle-orm";
import { communityReports } from "@shared/schema";
import type { ChatModule } from "../types";

export const barriersModule: ChatModule = {
  name: "barriers",
  description: "Checks community-reported accessibility barriers for a location and submits new barrier reports.",
  intents: ["barrier", "blocked", "broken", "out of order", "closed", "lift", "ramp", "kerb", "curb", "path", "access", "obstacle", "report"],
  quickActions: ["report_barrier"],
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
        name: "submit_barrier_report",
        description: "Submit a community barrier report about an accessibility issue at a location.",
        parameters: {
          type: "object",
          properties: {
            locationRef: { type: "string", description: "Location where the barrier is" },
            barrierType: {
              type: "string",
              enum: ["lift_out", "ramp_blocked", "path_closed", "door_too_heavy", "kerb_ramp_missing", "inaccessible_toilet", "unsafe_crossing", "driver_bypass", "helpful_staff", "other"],
              description: "Type of accessibility barrier",
            },
            severity: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Severity of the barrier" },
            description: { type: "string", description: "Detailed description of the barrier" },
          },
          required: ["locationRef", "barrierType", "severity"],
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

    submit_barrier_report: async (args, ctx) => {
      const [report] = await ctx.db
        .insert(communityReports)
        .values({
          reporterUserId: ctx.userId,
          locationRef: args.locationRef,
          barrierType: args.barrierType,
          severity: args.severity,
          description: args.description || null,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .returning();

      return JSON.stringify({
        success: true,
        reportId: report.id,
        message: `Barrier report submitted for ${args.locationRef}. Thank you for helping improve accessibility information for the community.`,
      });
    },
  },
};
