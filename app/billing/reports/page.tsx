import {
  BillingEmptyState,
  BillingPageHeader,
} from "@/components/billing/BillingPageChrome";
import { FinanceKpiGrid } from "@/components/billing/FinanceKpiGrid";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function BillingReportsPage() {
  const user = await requireAuth();

  const [invoiceCount, paidCount] = await Promise.all([
    prisma.billingInvoice.count({ where: { userId: user.id } }).catch(() => 0),
    prisma.billingInvoice
      .count({ where: { userId: user.id, status: "paid" } })
      .catch(() => 0),
  ]);

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Reports"
        description="Export-ready finance summaries. Detailed report packs will land here."
      />

      <FinanceKpiGrid
        title="Quick counts"
        items={[
          {
            id: "invoices",
            label: "Invoices",
            value: invoiceCount,
            kind: "number",
          },
          {
            id: "paid",
            label: "Paid invoices",
            value: paidCount,
            kind: "number",
            statusLabel: "Settled",
          },
        ]}
      />

      <BillingEmptyState title="Scheduled reports">
        CSV and PDF report packs (aged receivables, claim outcomes, payout
        remittance) are not configured yet. Use workspace lists for day-to-day
        checks.
      </BillingEmptyState>
    </div>
  );
}
