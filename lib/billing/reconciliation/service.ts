import type {
  BillingReconciliationMatch,
  BillingReconciliationSession,
  MapAbleUserRole,
} from "@prisma/client";

import { writeFinancialAudit } from "@/lib/billing/audit/financial-audit";
import { prisma } from "@/lib/prisma";
import type { ReconciliationMatchSuggestion } from "@/types/billing";

export type CreateReconciliationSessionInput = {
  organisationId?: string | null;
  source: string;
  notes?: string;
  createdById?: string | null;
  actorId?: string | null;
  actorRole?: MapAbleUserRole | string | null;
};

export async function createReconciliationSession(
  input: CreateReconciliationSessionInput
): Promise<BillingReconciliationSession> {
  const session = await prisma.billingReconciliationSession.create({
    data: {
      organisationId: input.organisationId ?? undefined,
      source: input.source,
      notes: input.notes,
      createdById: input.createdById ?? input.actorId ?? undefined,
      status: "open",
    },
  });

  await writeFinancialAudit({
    organisationId: input.organisationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "reconciliation_session_created",
    entityType: "BillingReconciliationSession",
    entityId: session.id,
    newValues: { source: input.source },
  });

  return session;
}

export type SuggestMatchesInput = {
  sessionId: string;
  /** Unreconciled external payment candidates (integer cents). */
  payments: {
    id: string;
    amountCents: number;
    payerName?: string | null;
    reference?: string | null;
    paidAt?: Date | null;
  }[];
  organisationId?: string | null;
};

/**
 * Suggest invoice↔payment matches with confidence reasons.
 */
export async function suggestMatches(
  input: SuggestMatchesInput
): Promise<ReconciliationMatchSuggestion[]> {
  const session = await prisma.billingReconciliationSession.findUnique({
    where: { id: input.sessionId },
  });
  if (!session) {
    throw new Error(`Reconciliation session not found: ${input.sessionId}`);
  }

  const invoices = await prisma.billingInvoice.findMany({
    where: {
      status: {
        in: [
          "issued",
          "sent",
          "pending_payment",
          "partially_paid",
          "overdue",
          "exported",
        ],
      },
      ...(input.organisationId || session.organisationId
        ? { providerId: input.organisationId ?? session.organisationId }
        : {}),
    },
    take: 500,
    orderBy: { createdAt: "desc" },
  });

  const suggestions: ReconciliationMatchSuggestion[] = [];

  for (const payment of input.payments) {
    for (const invoice of invoices) {
      const reasons: ReconciliationMatchSuggestion["reasons"] = [];
      let score = 0;

      const remaining = invoice.totalCents - invoice.amountPaidCents;
      if (payment.amountCents === remaining || payment.amountCents === invoice.totalCents) {
        reasons.push("amount");
        score += 40;
      } else if (
        Math.abs(payment.amountCents - remaining) <=
        Math.max(100, Math.floor(remaining * 0.01))
      ) {
        reasons.push("amount");
        score += 20;
      }

      if (
        payment.reference &&
        invoice.invoiceNumber &&
        payment.reference
          .toLowerCase()
          .includes(invoice.invoiceNumber.toLowerCase())
      ) {
        reasons.push("invoice_number");
        score += 35;
      }

      if (
        payment.reference &&
        invoice.participantDisplayRef &&
        payment.reference
          .toLowerCase()
          .includes(invoice.participantDisplayRef.toLowerCase())
      ) {
        reasons.push("participant_reference");
        score += 15;
      }

      if (
        payment.reference &&
        invoice.planManagerRef &&
        payment.reference
          .toLowerCase()
          .includes(invoice.planManagerRef.toLowerCase())
      ) {
        reasons.push("external_claim_reference");
        score += 15;
      }

      if (payment.payerName && invoice.payerType) {
        reasons.push("payer");
        score += 10;
      }

      if (payment.paidAt && invoice.issuedAt) {
        const days = Math.abs(
          (payment.paidAt.getTime() - invoice.issuedAt.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (days <= 14) {
          reasons.push("date_proximity");
          score += days <= 3 ? 15 : 8;
        }
      }

      if (reasons.length === 0 || score < 25) continue;

      suggestions.push({
        paymentId: payment.id,
        invoiceId: invoice.id,
        confidence: Math.min(100, score) / 100,
        reasons,
      });
    }
  }

  suggestions.sort((a, b) => b.confidence - a.confidence);

  // Persist top suggestions on the session
  for (const suggestion of suggestions.slice(0, 50)) {
    const payment = input.payments.find((p) => p.id === suggestion.paymentId);
    if (!payment) continue;
    await prisma.billingReconciliationMatch.create({
      data: {
        sessionId: input.sessionId,
        invoiceId: suggestion.invoiceId,
        externalPaymentRef: suggestion.paymentId,
        amountCents: payment.amountCents,
        confidenceBps: Math.round(suggestion.confidence * 10_000),
        reasons: suggestion.reasons,
        status: "suggested",
      },
    });
  }

  return suggestions;
}

export type ConfirmMatchInput = {
  matchId: string;
  actorId: string;
  actorRole?: MapAbleUserRole | string | null;
  notes?: string;
  organisationId?: string | null;
};

export async function confirmMatch(
  input: ConfirmMatchInput
): Promise<BillingReconciliationMatch> {
  const match = await prisma.billingReconciliationMatch.findUnique({
    where: { id: input.matchId },
    include: { session: true },
  });
  if (!match) {
    throw new Error(`Reconciliation match not found: ${input.matchId}`);
  }

  const updated = await prisma.billingReconciliationMatch.update({
    where: { id: match.id },
    data: {
      status: "confirmed",
      confirmedById: input.actorId,
      notes: input.notes,
    },
  });

  await writeFinancialAudit({
    organisationId:
      input.organisationId ?? match.session.organisationId ?? undefined,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: "reconciliation_match_confirmed",
    entityType: "BillingReconciliationMatch",
    entityId: match.id,
    previousValues: { status: match.status },
    newValues: {
      status: "confirmed",
      invoiceId: match.invoiceId,
      amountCents: match.amountCents,
    },
    reason: input.notes,
  });

  return updated;
}
