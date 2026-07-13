import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { createCareRequestSchema } from "@/lib/validation/care";
import { createTransportTripSchema } from "@/lib/validation/transport-trip-schemas";

export const careOSExecutableActionSchema = z.enum([
  "submit_care_request",
  "submit_transport_request",
]);

export type CareOSExecutableAction = z.infer<typeof careOSExecutableActionSchema>;

export const careOSPrepareActionSchema