import { z } from "zod";

const bookingSegmentSchema = z.object({
  segmentType: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  pickupAddress: z.string().optional(),
  dropoffAddress: z.string().optional(),
  bufferBeforeMinutes: z.number().int().min(0).default(0),
  bufferAfterMinutes: z.number().int().min(0).default(0),
  sortOrder: z.number().int().default(0),
});

export const createBookingSchema = z.object({
  bookingType: z.enum(["care", "transport", "care_transport"]),
  requestedStart: z.string().min(1),
  requestedEnd: z.string().optional(),
  pickupAddress: z.string().optional(),
  dropoffAddress: z.string().optional(),
  careLocation: z.string().optional(),
  accessibilitySummary: z.string().max(5000).optional(),
  participantNotes: z.string().max(5000).optional(),
  assignedOrganisationId: z.string().optional(),
  shareAccessibility: z.boolean().default(false),
  fundingSourceTag: z.string().optional(),
  segments: z.array(bookingSegmentSchema).optional(),
  status: z
    .enum([
      "draft",
      "requested",
      "awaiting_provider_acceptance",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "disputed",
    ])
    .optional(),
});

export const updateBookingSchema = z.object({
  status: z
    .enum([
      "draft",
      "requested",
      "awaiting_provider_acceptance",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "disputed",
    ])
    .optional(),
  providerNotes: z.string().max(5000).optional(),
  assignedOrganisationId: z.string().optional().nullable(),
  assignedWorkerId: z.string().optional().nullable(),
  assignedDriverId: z.string().optional().nullable(),
  requestedStart: z.string().optional(),
  requestedEnd: z.string().optional().nullable(),
  pickupAddress: z.string().optional().nullable(),
  dropoffAddress: z.string().optional().nullable(),
});
