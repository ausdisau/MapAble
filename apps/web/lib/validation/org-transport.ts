import { z } from "zod";

const vehicleTypeSchema = z.enum([
  "standard_car",
  "wheelchair_accessible_taxi",
  "accessible_van",
  "community_transport_bus",
  "other",
]);

/** Reject unknown fields on sensitive org-scoped transport mutations. */
export const createDriverBodySchema = z
  .object({
    userId: z.string().min(1),
    organisationId: z.string().min(1),
    displayName: z.string().min(1).max(200),
    phone: z.string().max(40).optional(),
    serviceRegions: z.array(z.string().min(1)).optional(),
  })
  .strict();

export const createVehicleBodySchema = z
  .object({
    organisationId: z.string().min(1),
    displayName: z.string().min(1).max(200),
    vehicleType: vehicleTypeSchema,
    registrationNumber: z.string().max(40).optional(),
    wheelchairAccessible: z.boolean().optional(),
    rampAvailable: z.boolean().optional(),
    liftAvailable: z.boolean().optional(),
  })
  .strict();

export const createAvailabilityBodySchema = z
  .object({
    organisationId: z.string().min(1),
    workerProfileId: z.string().min(1).optional(),
    driverProfileId: z.string().min(1).optional(),
    vehicleId: z.string().min(1).optional(),
    dayOfWeek: z.enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ]),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    timezone: z.string().min(1).optional(),
  })
  .strict();
