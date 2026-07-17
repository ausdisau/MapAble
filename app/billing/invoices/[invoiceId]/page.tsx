import { notFound } from "next/navigation";

import { ApprovalTimeline } from "@/components/billing/ApprovalTimeline";
import { BillingCopilotPanel } from "@/components/billing/BillingCopilotPanel";
import {
  BillingPageHeader,
} from "@/components/billing/BillingPageChrome";
import { EvidenceDrawer } from "@/components/billing/EvidenceDrawer";
import { InvoiceStatusBadge } from "@/components/billing/InvoiceStatusBadge";
import { PolicyValidationPanel } from "@/components/billing/PolicyValidationPanel";
import { requireAuth } from "@/lib/auth/guards";
import { formatAud } from "@/lib/billing/money";
import { prisma } from "@/lib/prisma";
import { mapableSectionCardClass } from "@/lib/brand/styles";
import type { BillingInvoiceState } from "@/types/billing";

export default async function BillingInvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const user = await requireAuth();
  const { invoiceId } = await params;

  const invoice = await prisma.billingInvoice
    .findFirst({
      where: { id: invoiceId, userId: user.id },
      include: {
        lineItems: { take: 20 },
        approvals: { orderBy: { createdAt: "asc" } },
      },
    })
    .catch(() => null);

  if (!invoice) notFound();

  const evidenceItems = invoice.lineItems.map((line) => ({
    id: line.id,
    label: line.description,
    status: line.evidenceStatus,
    detail: line.ndisLineItem
      ? `Support item ${line.ndisLineItem} · ${formatAud(line.totalCents)}`
      : formatAud(line.totalCents),
  }));

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title={invoice.invoiceNumber ?? `Invoice ${invoice.id.slice(0, 8)}`}
        description="Invoice detail, evidence, policy checks, and approvals."
      >
        <InvoiceStatusBadge status={invoice.status as BillingInvoiceState} />
      </BillingPageHeader>

      <section
        aria-labelledby="invoice-totals-heading"
        className={`${mapableSectionCardClass} p-5`}
      >
        <h2
          id="invoice-totals-heading"
          className="text-lg font-black text-[#0C1833]"
        >
          Amounts
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Subtotal", value: invoice.subtotalCents },
            { label: "GST", value: invoice.gstCents },
            { label: "Total", value: invoice.totalCents },
            { label: "Paid", value: invoice.amountPaidCents },
          ].map((row) => (
            <div key={row.label}>
              <dt className="text-sm text-slate-600">{row.label}</dt>
              <dd className="text-lg font-black tabular-nums text-[#005B7F]">
                {formatAud(row.value)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <EvidenceDrawer items={evidenceItems} />
        <PolicyValidationPanel
          result={
            invoice.policyVersionId
              ? {
                  ok: true,
                  status: "ok",
                  policyVersionId: invoice.policyVersionId,
                  messages: ["Attached policy version on record."],
                  capsExceeded: false,
                }
              : null
          }
        />
      </div>

      <ApprovalTimeline
        events={invoice.approvals.map((a) => ({
          id: a.id,
          approvalType: a.approvalType,
          decision: a.decision,
          actorRole: a.actorRole,
          reason: a.reason,
          decidedAt: a.decidedAt,
          createdAt: a.createdAt,
        }))}
      />

      <BillingCopilotPanel
        suggestion={{
          id: `suggest-${invoice.id}`,
          kind: "explain_status",
          title: "Explain this invoice status",
          body: `This invoice is currently marked ${invoice.status.replace(/_/g, " ")}. Review line evidence and funding before the next action.`,
          citations: [
            {
              entityType: "BillingInvoice",
              entityId: invoice.id,
              label: invoice.invoiceNumber ?? "Current invoice",
            },
          ],
          uncertainty: "medium",
          editable: true,
          requiresHumanConfirmation: true,
        }}
      />
    </div>
  );
}
