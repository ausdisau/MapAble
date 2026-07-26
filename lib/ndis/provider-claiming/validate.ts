import type {
  BillingFundingSourceType,
  FundingSourceType,
} from "@prisma/client";

export function mapBillingFundingType(
  type: BillingFundingSourceType | null | undefined
): FundingSourceType | undefined {
  if (!type) return undefined;
  switch (type) {
    case "ndis_plan_managed":
      return "ndis_plan_managed";
    case "ndis_self_managed":
      return "ndis_self_managed";
    default:
      return "ndis_agency_managed";
  }
}

import type {
  ClaimValidationFinding,
  NdiaProviderClaimPayload,
} from "@/lib/ndis/provider-claiming/types";
import { prisma } from "@/lib/prisma";

export function validateFundingForProviderClaim(
  fundingType: FundingSourceType | null | undefined
): ClaimValidationFinding[] {
  const findings: ClaimValidationFinding[] = [];
  if (fundingType === "ndis_plan_managed") {
    findings.push({
      code: "plan_managed",
      severity: "error",
      message:
        "Plan-managed participants are claimed by the plan manager, not via registered provider direct claiming.",
    });
  }
  if (fundingType === "private_pay") {
    findings.push({
      code: "private_pay",
      severity: "error",
      message: "Private-pay invoices must not be submitted as NDIA provider claims.",
    });
  }
  if (fundingType === "ndis_self_managed") {
    findings.push({
      code: "self_managed",
      severity: "warning",
      message:
        "Self-managed participants usually reimburse via participant claiming; confirm NDIA guidance before provider direct claim.",
    });
  }
  if (!fundingType || fundingType === "ndis_agency_managed") {
    findings.push({
      code: "agency_managed_ok",
      severity: "warning",
      message: "Agency-managed funding is the typical path for registered provider NDIA claims.",
    });
  }
  return findings;
}

export async function validateClaimPayload(
  payload: NdiaProviderClaimPayload,
  organisationId: string
): Promise<ClaimValidationFinding[]> {
  const findings: ClaimValidationFinding[] = [];

  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
  });
  if (!org) {
    findings.push({
      code: "org_missing",
      severity: "error",
      message: "Organisation not found.",
    });
    return findings;
  }

  if (!org.ndisRegistrationClaimed || !org.ndisRegistrationNumber) {
    findings.push({
      code: "provider_not_registered",
      severity: "error",
      message:
        "Organisation must have NDIS registration claimed and a registration number on file.",
    });
  }

  if (payload.provider.ndisRegistrationNumber !== org.ndisRegistrationNumber) {
    findings.push({
      code: "registration_mismatch",
      severity: "error",
      message: "Claim registration number does not match organisation record.",
    });
  }

  if (!payload.participant.ndisNumber) {
    findings.push({
      code: "participant_ndis_missing",
      severity: "error",
      message:
        "Participant NDIS number is required. Add it to the participant profile (encrypted at rest).",
    });
  }

  if (payload.lines.length === 0) {
    findings.push({
      code: "no_lines",
      severity: "error",
      message: "At least one claim line with a support item code is required.",
    });
  }

  for (const line of payload.lines) {
    if (!line.supportItemCode?.trim()) {
      findings.push({
        code: "missing_support_item",
        severity: "error",
        message: `Line ${line.lineNumber}: missing NDIS support item code.`,
      });
    } else {
      const item = await prisma.ndisSupportItem.findUnique({
        where: { code: line.supportItemCode },
      });
      if (!item?.active) {
        findings.push({
          code: "unknown_support_item",
          severity: "warning",
          message: `Line ${line.lineNumber}: support item ${line.supportItemCode} not in active catalogue.`,
        });
      } else if (
        item.priceCapCents != null &&
        line.unitPriceCents > item.priceCapCents
      ) {
        findings.push({
          code: "price_above_cap",
          severity: "error",
          message: `Line ${line.lineNumber}: unit price exceeds catalogue cap for ${line.supportItemCode}.`,
        });
      }
    }
    if (line.quantity <= 0) {
      findings.push({
        code: "invalid_quantity",
        severity: "error",
        message: `Line ${line.lineNumber}: quantity must be positive.`,
      });
    }
  }

  return findings;
}

export function hasBlockingFindings(findings: ClaimValidationFinding[]): boolean {
  return findings.some((f) => f.severity === "error");
}
