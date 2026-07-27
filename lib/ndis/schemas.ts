import {
  NdisDeliveryAuthorizationType,
  NdisPaymentRoute,
  NdisServiceDeliveryMechanism,
  ParticipantProviderRelationshipStatus,
} from "@prisma/client";
import { z } from "zod";

export const validateClaimLineSchema = z.object({
  claimLineId: z.string().cuid(),
});

export const claimFromBookingSchema = z.object({
  bookingId: z.string().cuid(),
  providerOrgId: z.string().cuid(),
  supportItemCode: z.string().optional(),
  unitPriceCents: z.number().int().nonnegative().optional(),
  quantity: z.number().positive().optional(),
  evidenceJson: z.record(z.string(), z.unknown()).optional(),
  participantConfirmationException: z.string().optional(),
});

export const updateClaimLineStatusSchema = z.object({
  status: z.enum([
    "submitted",
    "pending",
    "paid",
    "rejected",
    "corrected",
    "resubmitted",
    "voided",
  ]),
  rejectionCode: z.string().optional(),
  rejectionMessage: z.string().optional(),
  resubmit: z
    .object({
      supportItemCode: z.string().optional(),
      unitPriceCents: z.number().int().nonnegative().optional(),
      quantity: z.number().positive().optional(),
      serviceStartDate: z.string().optional(),
      serviceEndDate: z.string().optional(),
    })
    .optional(),
});

/** NDIS claim batch — distinct from billing createClaimBatchSchema. */
export const createNdisClaimBatchSchema = z.object({
  providerOrgId: z.string().cuid(),
  paymentRoute: z.nativeEnum(NdisPaymentRoute),
  claimLineIds: z.array(z.string().cuid()).min(1),
  batchReference: z.string().optional(),
});

export const recordDeliveryEventSchema = z.object({
  providerOrgId: z.string().cuid(),
  participantId: z.string().cuid(),
  paymentRoute: z.nativeEnum(NdisPaymentRoute),
  deliveryMechanism: z.nativeEnum(NdisServiceDeliveryMechanism),
  serviceDate: z.string().datetime(),
  authorizationId: z.string().cuid().optional(),
  careShiftId: z.string().cuid().optional(),
  careServiceLogId: z.string().cuid().optional(),
  claimLineId: z.string().cuid().optional(),
  quantityMinutes: z.number().int().positive().optional(),
  evidenceJson: z.record(z.string(), z.unknown()).optional(),
});

export const createDeliveryAuthorizationSchema = z.object({
  providerOrgId: z.string().cuid(),
  participantId: z.string().cuid(),
  paymentRoute: z.nativeEnum(NdisPaymentRoute),
  deliveryMechanism: z.nativeEnum(NdisServiceDeliveryMechanism),
  authorizationType: z.nativeEnum(NdisDeliveryAuthorizationType).optional(),
  supportItemCode: z.string().optional(),
  supportCategoryCode: z.string().optional(),
  serviceAgreementId: z.string().cuid().optional(),
  careBookingId: z.string().cuid().optional(),
  ndiaBookingReference: z.string().optional(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const patchDeliveryAuthorizationSchema = z.object({
  action: z.enum(["activate", "suspend", "revoke"]),
});

export const createParticipantProviderRelationshipSchema = z.object({
  participantId: z.string().cuid(),
  providerOrgId: z.string().cuid(),
  status: z.nativeEnum(ParticipantProviderRelationshipStatus).optional(),
  notes: z.string().optional(),
});

export const patchParticipantProviderRelationshipSchema = z.object({
  status: z.nativeEnum(ParticipantProviderRelationshipStatus),
  notes: z.string().optional(),
});

export const suggestLineItemSchema = z.object({
  sourceType: z.string().min(1),
  sourceId: z.string().min(1),
  hints: z
    .object({
      supportItemCode: z.string().optional(),
      serviceType: z.string().optional(),
    })
    .optional(),
});

export const priceRowSchema = z.object({
  code: z.string().min(1),
  name: z.string().default(""),
  priceCapCents: z.number().int().optional(),
  unitType: z.string().optional(),
  category: z.string().optional(),
});

export const importPricingRowsSchema = z.object({
  rows: z.array(priceRowSchema).min(1),
  fileName: z.string().optional(),
});

export const createSupportItemSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  unitType: z.string().optional(),
  priceCapCents: z.number().int().nonnegative().optional(),
  effectiveFrom: z.string().datetime().optional(),
});

export const searchClaimLinesQuerySchema = z.object({
  providerOrgId: z.string().cuid().optional(),
  status: z.string().optional(),
  paymentRoute: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});
