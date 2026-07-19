import type { BillingCreditNote, MapAbleUserRole } from "@prisma/client";

import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import { transitionInvoice } from "@/lib/billing/invoicing/issue";
import { normalizeLegacyStatus } from "@/lib/billing/invoicing/state-machine";
import { prisma } from "@/lib/prisma";

export type CreateCreditNoteInput = {
  invoiceId: string;
  amountCents: number;
  reason: string;
  actorId: string;
  actorRole?: MapAbleUserRole | string | null;
  lineItemIds?: string[];
  organisationId?: string | null;
  /** When true, also transition invoice toward credited where allowed. */
  transitionInvoice?: boolean;
};

/**
 * Create a credit note against an invoice. Amounts are integer cents only.
 */
export async function createCreditNote(
  input: CreateCreditNoteInput
): Promise<BillingCreditNote> {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error("amountCents must be a positive integer");
  }
  if (!input.reason?.trim()) {
    throw new Error("reason is required for credit notes");
  }

  const invoice = await prisma.billingInvoice.findUnique({
    where: { id: input.invoiceId },
  });
  if (!invoice) {
    throw new Error(`Invoice not found: ${input.invoiceId}`);
  }
  if (input.amountCents > invoice.totalCents) {
    throw new Error("Credit note amount cannot exceed invoice total");
  }

  const creditNote = await prisma.billingCreditNote.create({
    data: {
      invoiceId: invoice.id,
      amountCents: input.amountCents,
      reason: input.reason.trim(),
      status: "draft",
      lineItemIds: input.lineItemIds ?? undefined,
      createdById: input.actorId,
    },
  });

  if (input.transitionInvoice !== false && input.actorRole) {
    const from = normalizeLegacyStatus(invoice.status);
    if (
      from === "paid" ||
      from === "partially_paid" ||
      from === "disputed"
    ) {
      await transitionInvoice({
        invoiceId: invoice.id,
        to: "credited",
        actorId: input.actorId,
        actorRole: input.actorRole,
        reason: input.reason,
        organisationId: input.organisationId ?? invoice.providerId,
      });
    }
  }

  await writeFinancialAudit({
    organisationId: input.organisationId ?? invoice.providerId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "credit_note_created",
    entityType: "BillingCreditNote",
    entityId: creditNote.id,
    participantId: invoice.userId,
    newValues: {
      invoiceId: invoice.id,
      amountCents: input.amountCents,
      status: creditNote.status,
    },
    reason: input.reason,
  });

  return creditNote;
}
