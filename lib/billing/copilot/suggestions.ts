import { randomUUID } from "crypto";

import { plainLanguageStatus } from "@/lib/billing/invoicing/state-machine";
import { formatAud } from "@/lib/billing/money";
import { prisma } from "@/lib/prisma";
import type { BillingCopilotSuggestion } from "@/types/billing";

function suggestion(
  partial: Omit<
    BillingCopilotSuggestion,
    "editable" | "requiresHumanConfirmation" | "id"
  > & { id?: string }
): BillingCopilotSuggestion {
  return {
    id: partial.id ?? randomUUID(),
    kind: partial.kind,
    title: partial.title,
    body: partial.body,
    citations: partial.citations,
    uncertainty: partial.uncertainty,
    editable: true,
    requiresHumanConfirmation: true,
  };
}

export type GenerateCopilotSuggestionsInput = {
  invoiceId?: string;
  serviceRecordId?: string;
  paymentId?: string;
  matchSessionId?: string;
};

/**
 * Generate Billing Copilot suggestions only.
 * NO autonomous actions — every suggestion is editable and requires human confirmation.
 * proposedAction is intentionally never set (typed as never on BillingCopilotSuggestion).
 */
export async function generateBillingCopilotSuggestions(
  input: GenerateCopilotSuggestionsInput
): Promise<BillingCopilotSuggestion[]> {
  const out: BillingCopilotSuggestion[] = [];

  if (input.invoiceId) {
    const invoice = await prisma.billingInvoice.findUnique({
      where: { id: input.invoiceId },
      include: {
        lineItems: true,
        approvals: true,
        transitions: { orderBy: { createdAt: "asc" }, take: 20 },
      },
    });

    if (invoice) {
      out.push(
        suggestion({
          kind: "explain_status",
          title: "Explain invoice status",
          body: `This invoice is currently “${plainLanguageStatus(invoice.status)}”. Total ${formatAud(invoice.totalCents)}; paid ${formatAud(invoice.amountPaidCents)}. You can edit this explanation before sharing.`,
          citations: [
            {
              entityType: "BillingInvoice",
              entityId: invoice.id,
              label: invoice.invoiceNumber ?? invoice.id,
            },
          ],
          uncertainty: "low",
        })
      );

      const reviewLines = invoice.lineItems.filter(
        (l) => l.validationStatus === "POLICY_REVIEW_REQUIRED"
      );
      if (reviewLines.length > 0 || invoice.status === "policy_review_required") {
        out.push(
          suggestion({
            kind: "summarise_validation",
            title: "Summarise policy validation",
            body: `${reviewLines.length || "Some"} line(s) need pricing policy review. Confirm rates against the active policy version before issuing. This is a draft summary for a human reviewer.`,
            citations: reviewLines.map((l) => ({
              entityType: "BillingInvoiceLineItem",
              entityId: l.id,
              label: l.description,
            })),
            uncertainty: "medium",
          })
        );
      }

      const missingEvidence = invoice.lineItems.filter(
        (l) => l.evidenceStatus === "missing"
      );
      if (missingEvidence.length > 0) {
        out.push(
          suggestion({
            kind: "missing_evidence",
            title: "Missing evidence checklist",
            body: `${missingEvidence.length} line(s) still show missing evidence. Attach timesheets, shift confirmations, or trip records before approval.`,
            citations: missingEvidence.map((l) => ({
              entityType: "BillingInvoiceLineItem",
              entityId: l.id,
              label: l.description,
            })),
            uncertainty: "medium",
          })
        );
      }

      out.push(
        suggestion({
          kind: "draft_explanation",
          title: "Draft participant-facing explanation",
          body: `Here is a draft note you can edit: “Your invoice ${invoice.invoiceNumber ?? "(draft)"} covers services totaling ${formatAud(invoice.totalCents)}. Please review the line items and confirm if anything looks incorrect.”`,
          citations: [
            {
              entityType: "BillingInvoice",
              entityId: invoice.id,
              label: "Invoice",
            },
          ],
          uncertainty: "medium",
        })
      );

      if (invoice.status === "disputed") {
        out.push(
          suggestion({
            kind: "dispute_timeline",
            title: "Dispute timeline draft",
            body: `Draft timeline for human review: invoice moved through ${invoice.transitions.length} recorded transition(s). Confirm facts before responding to the participant.`,
            citations: invoice.transitions.map((t) => ({
              entityType: "BillingInvoiceTransition",
              entityId: t.id,
              label: `${t.priorState} → ${t.newState}`,
            })),
            uncertainty: "high",
          })
        );
      }

      if (invoice.ndisClaimable) {
        out.push(
          suggestion({
            kind: "plan_manager_followup",
            title: "Plan manager follow-up draft",
            body: "Draft (edit before sending): Please find the claim pack for review. This message was prepared by Billing Copilot and has not been sent.",
            citations: [
              {
                entityType: "BillingInvoice",
                entityId: invoice.id,
                label: invoice.invoiceNumber ?? invoice.id,
              },
            ],
            uncertainty: "high",
          })
        );
      }
    }
  }

  if (input.serviceRecordId) {
    const record = await prisma.billingServiceRecord.findUnique({
      where: { id: input.serviceRecordId },
    });
    if (record) {
      out.push(
        suggestion({
          kind: "suggest_classification",
          title: "Suggest line classification",
          body: `Based on source “${record.sourceType}” and service type “${record.serviceType}”, a human may classify charge lines as direct support, travel, or non-labour. Confirm before applying.`,
          citations: [
            {
              entityType: "BillingServiceRecord",
              entityId: record.id,
              label: record.sourceId,
            },
          ],
          uncertainty: "medium",
        })
      );

      if (record.supportItemCode && record.estimatedCents > 0) {
        out.push(
          suggestion({
            kind: "compare_rate",
            title: "Compare estimated rate to policy",
            body: `Estimated amount ${formatAud(record.estimatedCents)} for item ${record.supportItemCode}. Compare against the active price cap before locking. Copilot will not change rates automatically.`,
            citations: [
              {
                entityType: "BillingServiceRecord",
                entityId: record.id,
                label: record.supportItemCode,
              },
            ],
            uncertainty: "medium",
          })
        );
      }
    }
  }

  if (input.matchSessionId) {
    const matches = await prisma.billingReconciliationMatch.findMany({
      where: { sessionId: input.matchSessionId, status: "suggested" },
      take: 5,
      orderBy: { confidenceBps: "desc" },
    });
    for (const match of matches) {
      out.push(
        suggestion({
          kind: "suggest_match",
          title: "Suggested reconciliation match",
          body: `Suggested match at ${(match.confidenceBps / 100).toFixed(0)}% confidence for ${formatAud(match.amountCents)}. Confirm or reject manually — Copilot will not confirm matches.`,
          citations: [
            {
              entityType: "BillingReconciliationMatch",
              entityId: match.id,
              label: match.externalPaymentRef ?? match.id,
            },
            ...(match.invoiceId
              ? [
                  {
                    entityType: "BillingInvoice",
                    entityId: match.invoiceId,
                    label: "Invoice",
                  },
                ]
              : []),
          ],
          uncertainty: match.confidenceBps >= 7000 ? "low" : "high",
        })
      );
    }
  }

  if (input.paymentId) {
    out.push(
      suggestion({
        kind: "provider_query",
        title: "Provider remittance query draft",
        body: "Draft query for the provider finance team about this payment allocation. Edit and send manually — Copilot does not contact providers.",
        citations: [
          {
            entityType: "BillingPayment",
            entityId: input.paymentId,
            label: "Payment",
          },
        ],
        uncertainty: "high",
      })
    );
  }

  return out;
}
