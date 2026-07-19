import { AccessibleDataTable } from "@/components/billing/AccessibleDataTable";
import {
  BillingEmptyState,
  BillingPageHeader,
} from "@/components/billing/BillingPageChrome";
import { requireAuth } from "@/lib/auth/guards";
import { formatAud } from "@/lib/billing/money";
import { prisma } from "@/lib/prisma";

export default async function BillingReconciliationPage() {
  await requireAuth();

  const matches = await prisma.billingReconciliationMatch
    .findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        confidenceBps: true,
        status: true,
        createdAt: true,
        invoiceId: true,
        externalPaymentRef: true,
        amountCents: true,
      },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Reconciliation"
        description="Match bank and gateway payments to invoices. Suggested matches need human confirmation."
      />

      {matches.length === 0 ? (
        <BillingEmptyState title="No matches yet">
          Suggested payment-to-invoice matches will appear here with confidence
          scores and reasons. Confirm each match before posting.
        </BillingEmptyState>
      ) : (
        <AccessibleDataTable
          caption="Reconciliation matches"
          rows={matches}
          emptyMessage="No reconciliation matches yet."
          columns={[
            {
              id: "invoice",
              header: "Invoice",
              cell: (row) => row.invoiceId?.slice(0, 8) ?? "—",
            },
            {
              id: "payment",
              header: "External payment",
              cell: (row) => row.externalPaymentRef ?? "—",
            },
            {
              id: "status",
              header: "Status",
              cell: (row) => (
                <span>Status: {String(row.status).replace(/_/g, " ")}</span>
              ),
            },
            {
              id: "amount",
              header: "Amount",
              align: "right",
              cell: (row) => formatAud(row.amountCents),
            },
            {
              id: "confidence",
              header: "Confidence",
              align: "right",
              cell: (row) => `${(row.confidenceBps / 100).toFixed(1)}%`,
            },
            {
              id: "created",
              header: "Created",
              cell: (row) =>
                row.createdAt.toLocaleDateString("en-AU", {
                  dateStyle: "medium",
                }),
            },
          ]}
        />
      )}
    </div>
  );
}
