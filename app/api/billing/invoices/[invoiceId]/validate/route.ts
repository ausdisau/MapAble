import type { BillingInvoiceLineType } from "@prisma/client";

import { jsonError, jsonOk } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { validateAgainstPolicy } from "@/lib/billing/policy/validate";
import { prisma } from "@/lib/prisma";
import type { ChargeLineInput } from "@/types/billing";

function mapPrismaLineType(
  lineType: BillingInvoiceLineType | null,
  metadata: unknown
): ChargeLineInput["lineType"] {
  const meta = metadata as { chargeLineType?: ChargeLineInput["lineType"] } | null;
  if (meta?.chargeLineType) return meta.chargeLineType;
  if (!lineType) return "other";

  switch (lineType) {
    case "worker_service":
    case "provider_service":
      return "direct_support";
    case "transport":
      return "travel";
    case "platform_fee":
      return "platform_fee";
    case "cancellation_fee":
      return "cancellation";
    case "reimbursement":
      return "non_labour";
    case "adjustment":
    case "refund":
    case "other":
      return "other";
    default: {
      const _exhaustive: never = lineType;
      return _exhaustive;
    }
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireBillingPermission("billing:edit_draft");
  if (isResponse(user)) return user;

  const { invoiceId } = await params;
  const invoice = await prisma.billingInvoice.findUnique({
    where: { id: invoiceId },
    include: { lineItems: true },
  });
  if (!invoice) return jsonError("Invoice not found", 404);

  const lines: ChargeLineInput[] = invoice.lineItems.map((li) => ({
    description: li.description,
    supportItemCode: li.ndisLineItem ?? undefined,
    unit: li.unit ?? "each",
    quantity: Number(li.quantity),
    unitRateCents: li.unitAmountCents,
    gstApplicable: li.gstApplicable,
    lineType: mapPrismaLineType(li.lineType, li.metadata),
    serviceRecordId: li.serviceRecordId ?? undefined,
    workerOrProviderId: li.recipientId ?? undefined,
    policyVersionId: li.policyVersionId ?? undefined,
    fundingAllocation: {
      fundedCents: li.fundedCents,
      coPaymentCents: li.coPaymentCents,
      privateCents: li.privateCents,
      employerCents: 0,
    },
  }));

  try {
    const result = await validateAgainstPolicy({
      lines,
      organisationId: invoice.providerId,
      asOf: invoice.servicePeriodStart ?? undefined,
    });
    return jsonOk({ validation: result });
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Validation failed",
      400
    );
  }
}
