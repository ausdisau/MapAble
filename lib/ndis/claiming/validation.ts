import type { NdisClaimLineStatus, NdisPaymentRoute } from "@prisma/client";

import { ndisServiceDeliveryConfig } from "@/lib/config/ndis-service-delivery";
import { paymentRouteRequiresMyProviderCheck } from "@/lib/ndis/claiming/paymentRoute";
import type {
  ClaimLineInput,
  ClaimValidationIssue,
  ClaimValidationResult,
} from "@/lib/ndis/claiming/types";
import { validateDeliveryAuthorizationForClaim } from "@/lib/ndis/service-delivery/delivery-event-service";
import { prisma } from "@/lib/prisma";

const VOID_STATUSES: NdisClaimLineStatus[] = ["voided", "corrected"];

export async function validateClaimLineInput(
  input: ClaimLineInput
): Promise<ClaimValidationResult> {
  const issues: ClaimValidationIssue[] = [];
  const checkedAt = new Date().toISOString();

  const participant = await prisma.user.findUnique({
    where: { id: input.participantId },
    include: { participantProfile: true },
  });
  if (!participant) {
    issues.push({
      code: "participant_missing",
      field: "participantId",
      message: "Participant record was not found.",
      severity: "error",
    });
  }

  const provider = await prisma.organisation.findUnique({
    where: { id: input.providerOrgId },
  });
  if (!provider) {
    issues.push({
      code: "provider_missing",
      field: "providerOrgId",
      message: "Provider organisation was not found.",
      severity: "error",
    });
  }

  if (!input.paymentRoute) {
    issues.push({
      code: "funding_route_unknown",
      field: "paymentRoute",
      message: "Funding route is required (self-managed, plan-managed, or NDIA-managed).",
      severity: "error",
    });
  }

  if (!input.supportItemCode?.trim()) {
    issues.push({
      code: "support_item_missing",
      field: "supportItemCode",
      message: "NDIS support item code is required.",
      severity: "error",
    });
  } else {
    const catalogue = await prisma.ndisPricingCatalogueItem.findUnique({
      where: { supportItemCode: input.supportItemCode.trim() },
    });
    const supportItem = await prisma.ndisSupportItem.findUnique({
      where: { code: input.supportItemCode.trim() },
    });
    if (!catalogue?.active && !supportItem?.active) {
      issues.push({
        code: "support_item_unknown",
        field: "supportItemCode",
        message: `Support item ${input.supportItemCode} is not in the active pricing catalogue.`,
        severity: "error",
      });
    }
    const priceLimit =
      catalogue?.priceLimitCents ?? supportItem?.priceCapCents ?? null;
    if (priceLimit != null && input.unitPriceCents > priceLimit) {
      issues.push({
        code: "price_above_limit",
        field: "unitPriceCents",
        message: `Unit price exceeds the configured limit of $${(priceLimit / 100).toFixed(2)} for this support item.`,
        severity: "error",
      });
    }
  }

  if (!input.serviceStartDate || !input.serviceEndDate) {
    issues.push({
      code: "service_date_missing",
      field: "serviceStartDate",
      message: "Service start and end dates are required.",
      severity: "error",
    });
  }

  const evidence = input.evidenceJson as Record<string, unknown> | undefined;
  const hasDelivery =
    evidence?.deliveryRecorded === true ||
    (Array.isArray(evidence?.timesheetIds) && evidence.timesheetIds.length > 0) ||
    (Array.isArray(evidence?.shiftIds) && evidence.shiftIds.length > 0);
  if (!hasDelivery) {
    issues.push({
      code: "delivery_evidence_missing",
      field: "evidenceJson",
      message:
        "Delivery evidence is required (for example an approved timesheet or completed shift).",
      severity: "error",
    });
  }

  const hasConfirmation =
    typeof evidence?.participantConfirmedAt === "string" ||
    Boolean(input.participantConfirmationException?.trim());
  if (!hasConfirmation) {
    issues.push({
      code: "participant_confirmation_missing",
      field: "evidenceJson",
      message:
        "Participant confirmation is required, or document an exception reason.",
      severity: "error",
    });
  }

  if (input.quantity <= 0) {
    issues.push({
      code: "quantity_invalid",
      field: "quantity",
      message: "Quantity must be greater than zero.",
      severity: "error",
    });
  }

  if (input.unitPriceCents < 0) {
    issues.push({
      code: "price_negative",
      field: "unitPriceCents",
      message: "Unit price cannot be negative.",
      severity: "error",
    });
  }

  if (input.paymentRoute === "plan_managed") {
    const funding = await prisma.participantFundingSource.findFirst({
      where: {
        participantId: input.participantId,
        type: "ndis_plan_managed",
        status: "active",
      },
    });
    if (!funding?.planManagerOrganisationId && !funding?.displayName) {
      issues.push({
        code: "plan_manager_missing",
        message:
          "Plan manager details are required for plan-managed claims. Add an active plan-managed funding source.",
        severity: "error",
      });
    }
  }

  if (
    input.paymentRoute &&
    paymentRouteRequiresMyProviderCheck(input.paymentRoute)
  ) {
    const rel = await prisma.participantProviderRelationship.findUnique({
      where: {
        participantId_providerOrgId: {
          participantId: input.participantId,
          providerOrgId: input.providerOrgId,
        },
      },
    });
    if (!rel || rel.status !== "active") {
      issues.push({
        code: "my_provider_not_verified",
        message:
          "My Provider relationship must be active before NDIA-managed claims. Record verification in participant–provider relationships (portal-assisted, not scraped).",
        severity: "error",
      });
    }
  }

  if (input.bookingId && input.serviceStartDate) {
    const duplicate = await prisma.ndisClaimLine.findFirst({
      where: {
        participantId: input.participantId,
        providerOrgId: input.providerOrgId,
        supportItemCode: input.supportItemCode.trim(),
        bookingId: input.bookingId,
        serviceStartDate: new Date(input.serviceStartDate),
        status: { notIn: [...VOID_STATUSES] },
      },
    });
    if (duplicate) {
      issues.push({
        code: "duplicate_claim",
        message:
          "A claim line already exists for this participant, provider, support item, date, and booking.",
        severity: "error",
      });
    }
  }

  if (
    ndisServiceDeliveryConfig.requireAuthorizationForClaims &&
    input.paymentRoute &&
    input.serviceStartDate
  ) {
    const deliveryIssues = await validateDeliveryAuthorizationForClaim({
      participantId: input.participantId,
      providerOrgId: input.providerOrgId,
      paymentRoute: input.paymentRoute,
      deliveryMechanism: input.deliveryMechanism,
      supportItemCode: input.supportItemCode,
      serviceDate: new Date(input.serviceStartDate),
    });
    for (const issue of deliveryIssues) {
      issues.push({
        code: issue.code,
        field: issue.field,
        message: issue.message,
        severity: issue.severity,
      });
    }
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  return {
    valid: !hasErrors,
    issues,
    checkedAt,
  };
}

export function validationResultToStatus(
  result: ClaimValidationResult
): "validated" | "validation_failed" {
  return result.valid ? "validated" : "validation_failed";
}

export function mergeValidationJson(
  result: ClaimValidationResult
): Record<string, unknown> {
  return {
    valid: result.valid,
    issues: result.issues,
    checkedAt: result.checkedAt,
  };
}

export async function validateClaimLinesForBatch(
  lineIds: string[],
  expectedRoute: NdisPaymentRoute,
  providerOrgId: string
): Promise<ClaimValidationResult> {
  const issues: ClaimValidationIssue[] = [];
  const lines = await prisma.ndisClaimLine.findMany({
    where: { id: { in: lineIds } },
  });

  if (lines.length !== lineIds.length) {
    issues.push({
      code: "lines_missing",
      message: "One or more claim lines could not be found.",
      severity: "error",
    });
  }

  for (const line of lines) {
    if (line.providerOrgId !== providerOrgId) {
      issues.push({
        code: "provider_org_mismatch",
        message: `Claim line ${line.id.slice(0, 8)}… belongs to a different provider organisation than the batch.`,
        severity: "error",
      });
    }
    if (line.status !== "validated") {
      issues.push({
        code: "line_not_validated",
        message: `Claim line ${line.id.slice(0, 8)}… must be validated before batching.`,
        severity: "error",
      });
    }
    if (line.paymentRoute !== expectedRoute) {
      issues.push({
        code: "route_mismatch",
        message: `Claim line ${line.id.slice(0, 8)}… uses a different funding route than the batch.`,
        severity: "error",
      });
    }
    if (line.batchId) {
      issues.push({
        code: "already_batched",
        message: `Claim line ${line.id.slice(0, 8)}… is already in a batch.`,
        severity: "error",
      });
    }
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  return {
    valid: !hasErrors,
    issues,
    checkedAt: new Date().toISOString(),
  };
}
