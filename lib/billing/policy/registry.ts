import type { PricingPolicyStatus, PricingRule } from "@prisma/client";

import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import { prisma } from "@/lib/prisma";
import type { PolicyValidationResult } from "@/types/billing";

export type FindActivePricingRuleInput = {
  supportItemNumber: string;
  asOf?: Date;
  organisationId?: string | null;
  weekdayOrTimeBand?: string | null;
  jurisdiction?: string;
};

export type FindActivePricingRuleResult =
  | { ok: true; rule: PricingRule; policyVersionId: string }
  | {
      ok: false;
      status: "POLICY_REVIEW_REQUIRED";
      messages: string[];
    };

/**
 * Lookup an active PricingRule for a support item as of a given date.
 * Missing / inactive policy → POLICY_REVIEW_REQUIRED (never invent a rate).
 */
export async function findActivePricingRule(
  input: FindActivePricingRuleInput
): Promise<FindActivePricingRuleResult> {
  const asOf = input.asOf ?? new Date();
  const jurisdiction = input.jurisdiction ?? "AU";

  const rules = await prisma.pricingRule.findMany({
    where: {
      supportItemNumber: input.supportItemNumber,
      status: { in: ["verified", "active"] satisfies PricingPolicyStatus[] },
      ...(input.weekdayOrTimeBand
        ? { weekdayOrTimeBand: input.weekdayOrTimeBand }
        : {}),
      policyVersion: {
        status: "active",
        effectiveFrom: { lte: asOf },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: asOf } }],
        policy: {
          jurisdiction,
          ...(input.organisationId
            ? {
                OR: [
                  { organisationId: input.organisationId },
                  { organisationId: null },
                ],
              }
            : { organisationId: null }),
        },
      },
    },
    include: {
      policyVersion: {
        include: { policy: true },
      },
    },
    orderBy: [
      { policyVersion: { effectiveFrom: "desc" } },
      { updatedAt: "desc" },
    ],
  });

  // Prefer organisation-scoped policy over platform-wide when both match
  const preferred =
    (input.organisationId
      ? rules.find(
          (r) => r.policyVersion.policy.organisationId === input.organisationId
        )
      : undefined) ?? rules[0];

  if (!preferred) {
    return {
      ok: false,
      status: "POLICY_REVIEW_REQUIRED",
      messages: [
        `No active pricing policy found for support item ${input.supportItemNumber} as of ${asOf.toISOString()}. Review required before charging.`,
      ],
    };
  }

  return {
    ok: true,
    rule: preferred,
    policyVersionId: preferred.policyVersionId,
  };
}

export type ValidateRateAgainstPolicyInput = {
  supportItemNumber: string;
  unitRateCents: number;
  asOf?: Date;
  organisationId?: string | null;
  weekdayOrTimeBand?: string | null;
};

/**
 * Compare a proposed unit rate to the active price cap.
 */
export async function validateRateAgainstPolicy(
  input: ValidateRateAgainstPolicyInput
): Promise<PolicyValidationResult> {
  const found = await findActivePricingRule({
    supportItemNumber: input.supportItemNumber,
    asOf: input.asOf,
    organisationId: input.organisationId,
    weekdayOrTimeBand: input.weekdayOrTimeBand,
  });

  if (!found.ok) {
    return {
      ok: false,
      status: "POLICY_REVIEW_REQUIRED",
      messages: found.messages,
      capsExceeded: false,
    };
  }

  const messages: string[] = [];
  const capsExceeded = input.unitRateCents > found.rule.priceCapCents;
  if (capsExceeded) {
    messages.push(
      `Unit rate ${input.unitRateCents}¢ exceeds price cap ${found.rule.priceCapCents}¢ for ${input.supportItemNumber}. Review required.`
    );
  }

  if (capsExceeded) {
    return {
      ok: false,
      status: "POLICY_REVIEW_REQUIRED",
      policyVersionId: found.policyVersionId,
      messages,
      capsExceeded: true,
    };
  }

  return {
    ok: true,
    status: "ok",
    policyVersionId: found.policyVersionId,
    messages: [],
    capsExceeded: false,
  };
}

export type ActivatePolicyVersionInput = {
  policyVersionId: string;
  actorId: string;
  actorRole?: string | null;
  organisationId?: string | null;
  reason?: string;
};

/**
 * Activate a pricing policy version and supersede any previously active version
 * for the same policy.
 */
export async function activatePolicyVersion(
  input: ActivatePolicyVersionInput
): Promise<{ policyVersionId: string; supersededIds: string[] }> {
  const version = await prisma.pricingPolicyVersion.findUnique({
    where: { id: input.policyVersionId },
  });
  if (!version) {
    throw new Error(`Pricing policy version not found: ${input.policyVersionId}`);
  }
  if (version.status === "retired") {
    throw new Error("Cannot activate a retired policy version");
  }

  const superseded = await prisma.pricingPolicyVersion.findMany({
    where: {
      policyId: version.policyId,
      status: "active",
      id: { not: version.id },
    },
  });

  await prisma.$transaction(async (tx) => {
    if (superseded.length > 0) {
      await tx.pricingPolicyVersion.updateMany({
        where: { id: { in: superseded.map((s) => s.id) } },
        data: { status: "superseded" },
      });
    }
    await tx.pricingPolicyVersion.update({
      where: { id: version.id },
      data: {
        status: "active",
        verificationDate: version.verificationDate ?? new Date(),
        verifiedByUserId: version.verifiedByUserId ?? input.actorId,
      },
    });
    await tx.pricingRule.updateMany({
      where: { policyVersionId: version.id },
      data: { status: "active" },
    });
  });

  const supersededIds = superseded.map((s) => s.id);

  await writeFinancialAudit({
    organisationId: input.organisationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "policy_version_activated",
    entityType: "PricingPolicyVersion",
    entityId: version.id,
    previousValues: { status: version.status },
    newValues: { status: "active", supersededIds },
    reason: input.reason,
    policyVersionId: version.id,
  });

  return { policyVersionId: version.id, supersededIds };
}
