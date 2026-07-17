import type {
  BillingInvoiceLineType,
  BillingServiceRecord,
  BillingServiceType,
} from "@prisma/client";

import {
  addCents,
  allocateProportionally,
  multiplyCents,
  type Cents,
} from "@/lib/billing/money";
import { findActivePricingRule } from "@/lib/billing/policy/registry";
import { assertServiceRecordLocked } from "@/lib/billing/service-records/service";
import type { ChargeLineInput } from "@/types/billing";

export type FundingSplitWeights = {
  funded: number;
  coPayment: number;
  private: number;
  employer: number;
};

export type VerticalSplitConfig = {
  /** Named allocation buckets (e.g. care, travel, transport, foods). Weights must be positive. */
  buckets: { key: string; weight: number; lineType: ChargeLineInput["lineType"] }[];
};

export type GenerateChargeLinesInput = {
  serviceRecord: BillingServiceRecord;
  /** Override unit rate; otherwise use policy cap when available. */
  unitRateCents?: number;
  gstApplicable?: boolean;
  fundingSplit?: FundingSplitWeights;
  /**
   * Optional multi-line vertical split (care/travel/transport/foods).
   * Configurable weights — never hardcoded percentages in UI.
   */
  verticalSplit?: VerticalSplitConfig;
  organisationId?: string | null;
  asOf?: Date;
};

export type GenerateChargeLinesResult = {
  lines: ChargeLineInput[];
  policyVersionId?: string;
  policyReviewRequired: boolean;
  messages: string[];
  totalCents: Cents;
};

const DEFAULT_FUNDING: FundingSplitWeights = {
  funded: 1,
  coPayment: 0,
  private: 0,
  employer: 0,
};

function mapServiceTypeToLineType(
  serviceType: BillingServiceType
): ChargeLineInput["lineType"] {
  switch (serviceType) {
    case "care":
    case "jobs":
      return "direct_support";
    case "transport":
      return "travel";
    case "foods":
      return "ingredient";
    case "subscription":
      return "subscription";
    case "marketplace":
    case "moves":
    case "academy":
    case "other":
      return "other";
    default: {
      const _exhaustive: never = serviceType;
      return _exhaustive;
    }
  }
}

/** Map charge line types onto Prisma BillingInvoiceLineType. */
export function toPrismaLineType(
  lineType: ChargeLineInput["lineType"]
): BillingInvoiceLineType {
  switch (lineType) {
    case "direct_support":
      return "worker_service";
    case "travel":
      return "transport";
    case "cancellation":
      return "cancellation_fee";
    case "platform_fee":
      return "platform_fee";
    case "non_labour":
      return "reimbursement";
    case "co_payment":
    case "ingredient":
    case "preparation":
    case "delivery":
    case "subscription":
    case "commission":
    case "other":
      return "other";
    default: {
      const _exhaustive: never = lineType;
      return _exhaustive;
    }
  }
}

function applyFundingSplit(
  lineTotalCents: Cents,
  split: FundingSplitWeights
): ChargeLineInput["fundingAllocation"] {
  const weights = [
    split.funded,
    split.coPayment,
    split.private,
    split.employer,
  ];
  const weightSum = weights.reduce((s, w) => s + w, 0);
  if (weightSum <= 0) {
    return {
      fundedCents: lineTotalCents,
      coPaymentCents: 0,
      privateCents: 0,
      employerCents: 0,
    };
  }
  const [fundedCents, coPaymentCents, privateCents, employerCents] =
    allocateProportionally(lineTotalCents, weights);
  return {
    fundedCents: fundedCents ?? 0,
    coPaymentCents: coPaymentCents ?? 0,
    privateCents: privateCents ?? 0,
    employerCents: employerCents ?? 0,
  };
}

/**
 * Generate charge lines from a locked service record using policy + money helpers.
 * Refuses unlocked records. Missing policy → policyReviewRequired (caller sets status).
 */
export async function generateChargeLinesFromServiceRecord(
  input: GenerateChargeLinesInput
): Promise<GenerateChargeLinesResult> {
  const { serviceRecord } = input;
  assertServiceRecordLocked(serviceRecord);

  const asOf = input.asOf ?? serviceRecord.serviceStart;
  const organisationId =
    input.organisationId ?? serviceRecord.organisationId ?? null;
  const quantity = Number(serviceRecord.quantity);
  const messages: string[] = [];
  let policyVersionId: string | undefined;
  let policyReviewRequired = false;
  let unitRateCents = input.unitRateCents;

  if (serviceRecord.supportItemCode) {
    const found = await findActivePricingRule({
      supportItemNumber: serviceRecord.supportItemCode,
      asOf,
      organisationId,
    });
    if (!found.ok) {
      policyReviewRequired = true;
      messages.push(...found.messages);
      unitRateCents = unitRateCents ?? serviceRecord.estimatedCents;
    } else {
      policyVersionId = found.policyVersionId;
      if (unitRateCents === undefined) {
        unitRateCents = found.rule.priceCapCents;
      } else if (unitRateCents > found.rule.priceCapCents) {
        policyReviewRequired = true;
        messages.push(
          `Proposed rate ${unitRateCents}¢ exceeds cap ${found.rule.priceCapCents}¢ for ${serviceRecord.supportItemCode}.`
        );
      }
    }
  } else {
    policyReviewRequired = true;
    messages.push(
      "Support item code missing on service record. Review required before issuing."
    );
    unitRateCents = unitRateCents ?? serviceRecord.estimatedCents;
  }

  if (unitRateCents === undefined || !Number.isInteger(unitRateCents)) {
    throw new Error(
      "Cannot generate charge: unit rate unavailable and no estimate on service record."
    );
  }

  const fundingSplit = input.fundingSplit ?? DEFAULT_FUNDING;
  const gstApplicable = input.gstApplicable ?? false;
  const lines: ChargeLineInput[] = [];

  if (input.verticalSplit && input.verticalSplit.buckets.length > 0) {
    const gross = multiplyCents(unitRateCents, quantity);
    const weights = input.verticalSplit.buckets.map((b) => b.weight);
    const parts = allocateProportionally(gross, weights);

    for (let i = 0; i < input.verticalSplit.buckets.length; i++) {
      const bucket = input.verticalSplit.buckets[i]!;
      const partCents = parts[i] ?? 0;
      if (partCents === 0) continue;
      // Reconstruct unit rate for quantity=1 display; keep original qty on primary
      lines.push({
        description: `${serviceRecord.serviceType} — ${bucket.key}`,
        supportItemCode: serviceRecord.supportItemCode ?? undefined,
        unit: serviceRecord.unit,
        quantity: 1,
        unitRateCents: partCents,
        gstApplicable,
        lineType: bucket.lineType,
        fundingAllocation: applyFundingSplit(partCents, fundingSplit),
        policyVersionId,
        serviceRecordId: serviceRecord.id,
        workerOrProviderId: serviceRecord.workerOrProviderId ?? undefined,
      });
    }
  } else {
    const lineTotal = multiplyCents(unitRateCents, quantity);
    lines.push({
      description: `${serviceRecord.serviceType} service (${serviceRecord.sourceType})`,
      supportItemCode: serviceRecord.supportItemCode ?? undefined,
      unit: serviceRecord.unit,
      quantity,
      unitRateCents,
      gstApplicable,
      lineType: mapServiceTypeToLineType(serviceRecord.serviceType),
      fundingAllocation: applyFundingSplit(lineTotal, fundingSplit),
      policyVersionId,
      serviceRecordId: serviceRecord.id,
      workerOrProviderId: serviceRecord.workerOrProviderId ?? undefined,
    });
  }

  const totalCents = lines.reduce(
    (sum, line) =>
      addCents(sum, multiplyCents(line.unitRateCents, line.quantity)),
    0
  );

  return {
    lines,
    policyVersionId,
    policyReviewRequired,
    messages,
    totalCents,
  };
}

/** Default foods split helper — weights are caller-configurable. */
export function defaultFoodsSplit(weights?: {
  ingredient?: number;
  preparation?: number;
  delivery?: number;
}): VerticalSplitConfig {
  return {
    buckets: [
      {
        key: "ingredient",
        weight: weights?.ingredient ?? 50,
        lineType: "ingredient",
      },
      {
        key: "preparation",
        weight: weights?.preparation ?? 30,
        lineType: "preparation",
      },
      {
        key: "delivery",
        weight: weights?.delivery ?? 20,
        lineType: "delivery",
      },
    ],
  };
}

/** Care + travel split — weights configurable. */
export function defaultCareTravelSplit(weights?: {
  care?: number;
  travel?: number;
}): VerticalSplitConfig {
  return {
    buckets: [
      {
        key: "care",
        weight: weights?.care ?? 80,
        lineType: "direct_support",
      },
      {
        key: "travel",
        weight: weights?.travel ?? 20,
        lineType: "travel",
      },
    ],
  };
}
