import { z } from "zod";

export const createTransportBookingSchema = z.object({
  transportType: z
    .enum(["one_way", "return_trip", "multi_stop_placeholder"])
    .optional(),
  pickupAddress: z.string().min(3),
  dropoffAddress: z.string().min(3),
  pickupWindowStart: z.string().datetime(),
  pickupWindowEnd: z.string().datetime().optional(),
  returnTripRequired: z.boolean().optional(),
  passengerCount: z.number().int().min(1).max(8).optional(),
  mobilityAidSnapshot: z.record(z.string(), z.unknown()).optional(),
  vehicleRequirements: z.record(z.string(), z.unknown()).optional(),
  driverAssistanceRequired: z.boolean().optional(),
  pickupNotes: z.string().optional(),
  dropoffNotes: z.string().optional(),
  shareAccessibility: z.boolean().optional(),
  shareAccessibilityConfirmed: z.boolean().optional(),
  careRequestId: z.string().optional(),
});

export const assignOperatorSchema = z.object({
  organisationId: z.string(),
});

export const assignDriverSchema = z.object({
  driverProfileId: z.string(),
});

export const assignVehicleSchema = z.object({
  vehicleId: z.string(),
});
