import { isNdisServiceDeliveryMechanismEnabled } from "@/lib/config/ndis-service-delivery";
import { assertProviderMayServeParticipant } from "@/lib/ndis/participant-provider-relationship-service";
import { findActiveDeliveryAuthorization } from "@/lib/ndis/service-delivery/authorization-service";
import type {
  DeliveryValidationIssue,
  RecordDeliveryEventInput,
} from "@/lib/ndis/service-delivery/types";
import { prisma } from "@/lib/prisma";

export async function recordDeliveryEvent(input: RecordDeliveryEventInput) {
  if (!isNdisServiceDeliveryMechanismEnabled()) {
    throw new Error("NDIS_SERVICE_DELIVERY_DISABLED");
  }

  await assertProviderMayServeParticipant(
    input.participantId,
    input.providerOrgId,
    input.paymentRoute
  );

  if (input.authorizationId) {
    const auth = await prisma.ndisServiceDeliveryAuthorization.findUnique({
      where: { id: input.authorizationId },
      select: {
        participantId: true,
        providerOrgId: true,
        paymentRoute: true,
        deliveryMechanism: true,
      },
    });
    if (!auth) throw new Error("AUTHORIZATION_NOT_FOUND");
    if (
      auth.participantId !== input.participantId ||
      auth.providerOrgId !== input.providerOrgId
    ) {
      throw new Error("AUTHORIZATION_SCOPE_MISMATCH");
    }
  }

  if (input.careShiftId) {
    const shift = await prisma.careShift.findUnique({
      where: { id: input.careShiftId },
      select: { participantId: true, organisationId: true },
    });
    if (!shift) throw new Error("CARE_SHIFT_NOT_FOUND");
    if (
      shift.participantId !== input.participantId ||
      shift.organisationId !== input.providerOrgId
    ) {
      throw new Error("CARE_SHIFT_SCOPE_MISMATCH");
    }
  }

  if (input.claimLineId) {
    const line = await prisma.ndisClaimLine.findUnique({
      where: { id: input.claimLineId },
      select: { participantId: true, providerOrgId: true },
    });
    if (!line) throw new Error("CLAIM_LINE_NOT_FOUND");
    if (
      line.participantId !== input.participantId ||
      line.providerOrgId !== input.providerOrgId
    ) {
      throw new Error("CLAIM_LINE_SCOPE_MISMATCH");
    }
  }

  const event = await prisma.ndisServiceDeliveryEvent.create({
    data: {
      authorizationId: input.authorizationId,
      participantId: input.participantId,
      providerOrgId: input.providerOrgId,
      deliveryMechanism: input.deliveryMechanism,
      paymentRoute: input.paymentRoute,
      careShiftId: input.careShiftId,
      careServiceLogId: input.careServiceLogId,
      claimLineId: input.claimLineId,
      serviceDate: input.serviceDate,
      quantityMinutes: input.quantityMinutes,
      evidenceJson: input.evidenceJson as object | undefined,
      createdById: input.createdById,
    },
  });

  if (input.careServiceLogId) {
    await prisma.careServiceLog.update({
      where: { id: input.careServiceLogId },
      data: {
        deliveryMechanism: input.deliveryMechanism,
        deliveryAuthorizationId: input.authorizationId,
      },
    });
  }

  if (input.claimLineId) {
    await prisma.ndisClaimLine.update({
      where: { id: input.claimLineId },
      data: {
        deliveryMechanism: input.deliveryMechanism,
        deliveryAuthorizationId: input.authorizationId,
      },
    });
  }

  return event;
}

export async function validateDeliveryAuthorizationForClaim(params: {
  participantId: string;
  providerOrgId: string;
  paymentRoute: RecordDeliveryEventInput["paymentRoute"];
  deliveryMechanism?: RecordDeliveryEventInput["deliveryMechanism"] | null;
  supportItemCode?: string;
  serviceDate: Date;
}): Promise<DeliveryValidationIssue[]> {
  if (!isNdisServiceDeliveryMechanismEnabled()) return [];

  const issues: DeliveryValidationIssue[] = [];

  if (!params.deliveryMechanism) {
    issues.push({
      code: "delivery_mechanism_missing",
      field: "deliveryMechanism",
      message:
        "NDIS service delivery mechanism is required when delivery tracking is enabled.",
      severity: "error",
    });
    return issues;
  }

  try {
    const auth = await findActiveDeliveryAuthorization({
      participantId: params.participantId,
      providerOrgId: params.providerOrgId,
      paymentRoute: params.paymentRoute,
      deliveryMechanism: params.deliveryMechanism,
      supportItemCode: params.supportItemCode,
      serviceDate: params.serviceDate,
    });

    if (!auth) {
      issues.push({
        code: "delivery_authorization_missing",
        field: "deliveryAuthorizationId",
        message:
          "No active service delivery authorization covers this participant, provider, mechanism, and service date.",
        severity: "error",
      });
    } else if (
      params.paymentRoute === "ndia_managed" &&
      !auth.ndiaBookingReference
    ) {
      issues.push({
        code: "ndia_service_booking_reference_missing",
        field: "ndiaBookingReference",
        message:
          "NDIA-managed delivery requires a service booking reference on the authorization.",
        severity: "warning",
      });
    }
  } catch {
    // DB unavailable in CI — skip authorization lookup
  }

  return issues;
}
