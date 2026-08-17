import type {
  NdisDeliveryAuthorizationStatus,
  NdisDeliveryAuthorizationType,
  NdisPaymentRoute,
  NdisServiceDeliveryMechanism,
} from "@prisma/client";

export type {
  NdisDeliveryAuthorizationStatus,
  NdisDeliveryAuthorizationType,
  NdisPaymentRoute,
  NdisServiceDeliveryMechanism,
};

export type DeliveryMechanismDefinition = {
  code: NdisServiceDeliveryMechanism;
  label: string;
  description: string;
  claimTypes: string[];
};

export type CreateDeliveryAuthorizationInput = {
  participantId: string;
  providerOrgId: string;
  paymentRoute: NdisPaymentRoute;
  deliveryMechanism: NdisServiceDeliveryMechanism;
  authorizationType?: NdisDeliveryAuthorizationType;
  supportItemCode?: string;
  supportCategoryCode?: string;
  serviceAgreementId?: string;
  careBookingId?: string;
  ndiaBookingReference?: string;
  validFrom: Date;
  validTo?: Date;
  notes?: string;
  metadataJson?: Record<string, unknown>;
  createdById: string;
};

export type RecordDeliveryEventInput = {
  participantId: string;
  providerOrgId: string;
  deliveryMechanism: NdisServiceDeliveryMechanism;
  paymentRoute: NdisPaymentRoute;
  serviceDate: Date;
  authorizationId?: string;
  careShiftId?: string;
  careServiceLogId?: string;
  claimLineId?: string;
  quantityMinutes?: number;
  evidenceJson?: Record<string, unknown>;
  createdById: string;
};

export type DeliveryValidationIssue = {
  code: string;
  field?: string;
  message: string;
  severity: "error" | "warning";
};
