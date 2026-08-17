import type { TransportTripStatus } from "@prisma/client";
import { z } from "zod";

import { mobilityRequirementsSchema } from "@/lib/transport/mobility-schema";
import { TRANSPORT_TRIP_STATUSES } from "@/types/transport";

const statusEnum = z.enum(
  TRANSPORT_TRIP_STATUSES as unknown as [
    TransportTripStatus,
    ...TransportTripStatus[],
  ]
);

export const createTransportTripSchema = z.object({
  pickupAddress: z.string().min(3),
  pickupSuburb: z.string().optional(),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffAddress: z.string().min(3),
  dropoffSuburb: z.string().optional(),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime().optional(),
  accessNotes: z.string().max(2000).optional(),
  mobilityRequirements: mobilityRequirementsSchema.optional(),
  providerOrganisationId: z.string().optional(),
  prefillFromProfile: z.boolean().optional(),
});

export const patchTransportTripSchema = z.object({
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  accessNotes: z.string().max(2000).optional(),
  mobilityRequirements: mobilityRequirementsSchema.optional(),
});

export const cancelTransportTripSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const confirmTransportTripSchema = z.object({
  confirmed: z.boolean().default(true),
});

export const disputeTransportTripSchema = z.object({
  reason: z.string().min(3).max(2000),
});

export const driverStatusUpdateSchema = z.object({
  status: statusEnum,
  message: z.string().max(500).optional(),
});

export const driverLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const tripEvidenceSchema = z.object({
  evidenceType: z.string().min(1),
  notes: z.string().max(2000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const reportSafetyIssueSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(3).max(5000),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  escalateToIncident: z.boolean().optional(),
});

export type CreateTransportTripInput = z.infer<typeof createTransportTripSchema>;
