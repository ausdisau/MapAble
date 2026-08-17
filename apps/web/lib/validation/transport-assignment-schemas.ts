import { z } from "zod";

export const assignTripSchema = z.object({
  driverId: z.string().min(1),
  vehicleId: z.string().min(1),
});

export const declineTripSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const acceptTripSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const serviceRecoverySchema = z.object({
  reason: z.string().min(3).max(2000),
});
