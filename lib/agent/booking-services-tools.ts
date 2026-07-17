import { tool } from "ai";
import { z } from "zod";

import {
  TOOL_EXPLAIN_BOOKING_STATUS,
  TOOL_GET_BOOKING_CONTEXT,
  TOOL_SEARCH_BOOKINGS,
} from "@/lib/agent/tools/booking-tools";
import type { CurrentUser } from "@/lib/auth/current-user";
import {
  explainScopedBookingStatus,
  getScopedBookingContext,
  searchScopedBookings,
} from "@/lib/bookings/rag/search-service";

export const bookingServicesToolNames = {
  searchBookings: TOOL_SEARCH_BOOKINGS,
  getBookingContext: TOOL_GET_BOOKING_CONTEXT,
  explainBookingStatus: TOOL_EXPLAIN_BOOKING_STATUS,
} as const;

export function createBookingServicesTools(user: CurrentUser) {
  return {
    [TOOL_SEARCH_BOOKINGS]: tool({
      description:
        "Search the signed-in user's scoped care, transport, and combined bookings using natural language. Returns citable chunks with bookingId and chunkId.",
      inputSchema: z.object({
        query: z.string().min(1).describe("Natural language booking search"),
        recordType: z
          .enum(["care", "transport", "bundle"])
          .optional()
          .describe("Optional booking type filter"),
        status: z.string().optional().describe("Optional status filter"),
      }),
      execute: async ({ query, recordType, status }) => {
        const { hits, totalCandidates } = await searchScopedBookings(user, query, {
          recordType,
          status,
        });
        return {
          totalCandidates,
          count: hits.length,
          hits: hits.map((hit) => ({
            bookingId: hit.bookingId,
            recordType: hit.recordType,
            title: hit.title,
            score: hit.score,
            matchedTerms: hit.matchedTerms,
            chunks: hit.chunks.map((c) => ({
              chunkId: c.chunkId,
              sourceType: c.sourceType,
              title: c.title,
              excerpt: c.excerpt,
              scheduledStartAt: c.scheduledStartAt?.toISOString() ?? null,
            })),
          })),
        };
      },
    }),

    [TOOL_GET_BOOKING_CONTEXT]: tool({
      description:
        "Load full grounded context for one booking the user is allowed to see. Use after searchBookings narrows to a bookingId.",
      inputSchema: z.object({
        bookingId: z.string().min(1).describe("Care, transport, or bundle booking id"),
      }),
      execute: async ({ bookingId }) => {
        const ctx = await getScopedBookingContext(user, bookingId);
        if (!ctx) {
          return { found: false, bookingId };
        }
        return {
          found: true,
          bookingId: ctx.snapshot.id,
          recordType: ctx.snapshot.recordType,
          status: ctx.snapshot.status,
          title: ctx.snapshot.title,
          summary: ctx.snapshot.summary,
          scheduledStartAt: ctx.snapshot.scheduledStartAt?.toISOString() ?? null,
          scheduledEndAt: ctx.snapshot.scheduledEndAt?.toISOString() ?? null,
          organisationName: ctx.snapshot.organisationName,
          chunks: ctx.chunks.map((c) => ({
            chunkId: c.chunkId,
            sourceType: c.sourceType,
            title: c.title,
            excerpt: c.excerpt,
          })),
        };
      },
    }),

    [TOOL_EXPLAIN_BOOKING_STATUS]: tool({
      description:
        "Explain what a booking status means and suggested next steps for participants and providers. Does not guess — uses deterministic status copy.",
      inputSchema: z.object({
        bookingId: z.string().min(1),
      }),
      execute: async ({ bookingId }) => {
        const explanation = await explainScopedBookingStatus(user, bookingId);
        if (!explanation) {
          return { found: false, bookingId };
        }
        return { found: true, ...explanation };
      },
    }),
  };
}
