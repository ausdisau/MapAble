import type { ChargeLineInput, PolicyValidationResult } from "@/types/billing";

import {
  findActivePricingRule,
  validateRateAgainstPolicy,
} from "@/lib/billing/policy/registry";

export type ValidateChargeLinesInput = {
  lines: ChargeLineInput[];
  asOf?: Date;
  organisationId?: string | null;
};

/**
 * Validate charge lines against the active pricing policy registry.
 * Any missing policy or over-cap rate → POLICY_REVIEW_REQUIRED.
 */
export async function validateChargeLinesAgainstPolicy(
  input: ValidateChargeLinesInput
): Promise<PolicyValidationResult> {
  const messages: string[] = [];
  let capsExceeded = false;
  let policyVersionId: string | undefined;
  let needsReview = false;
  let failed = false;

  if (input.lines.length === 0) {
    return {
      ok: false,
      status: "FAILED",
      messages: ["At least one charge line is required."],
      capsExceeded: false,
    };
  }

  for (const line of input.lines) {
    if (line.unitRateCents < 0 || !Number.isInteger(line.unitRateCents)) {
      failed = true;
      messages.push(
        `Invalid unit rate for "${line.description}": must be a non-negative integer (cents).`
      );
      continue;
    }

    if (!(line.quantity > 0) || !Number.isFinite(line.quantity)) {
      failed = true;
      messages.push(
        `Invalid quantity for "${line.description}": must be a positive finite number.`
      );
      continue;
    }

    if (!line.supportItemCode) {
      // Non-catalogue lines (platform fee, private) skip catalogue lookup
      if (
        line.lineType === "platform_fee" ||
        line.lineType === "co_payment" ||
        line.lineType === "commission" ||
        line.lineType === "other"
      ) {
        continue;
      }
      needsReview = true;
      messages.push(
        `Support item code missing for "${line.description}". Review required.`
      );
      continue;
    }

    const found = await findActivePricingRule({
      supportItemNumber: line.supportItemCode,
      asOf: input.asOf,
      organisationId: input.organisationId,
    });

    if (!found.ok) {
      needsReview = true;
      messages.push(...found.messages);
      continue;
    }

    policyVersionId = policyVersionId ?? found.policyVersionId;
    line.policyVersionId = found.policyVersionId;

    const rateCheck = await validateRateAgainstPolicy({
      supportItemNumber: line.supportItemCode,
      unitRateCents: line.unitRateCents,
      asOf: input.asOf,
      organisationId: input.organisationId,
    });

    if (rateCheck.capsExceeded) {
      capsExceeded = true;
      needsReview = true;
    }
    if (!rateCheck.ok) {
      needsReview = true;
      messages.push(...rateCheck.messages);
    }
    if (rateCheck.policyVersionId) {
      policyVersionId = policyVersionId ?? rateCheck.policyVersionId;
    }
  }

  if (failed) {
    return {
      ok: false,
      status: "FAILED",
      policyVersionId,
      messages,
      capsExceeded,
    };
  }

  if (needsReview) {
    return {
      ok: false,
      status: "POLICY_REVIEW_REQUIRED",
      policyVersionId,
      messages,
      capsExceeded,
    };
  }

  return {
    ok: true,
    status: "ok",
    policyVersionId,
    messages: [],
    capsExceeded: false,
  };
}

/** Alias matching plan naming. */
export const validateAgainstPolicy = validateChargeLinesAgainstPolicy;
