import { AccessibleDataTable } from "@/components/billing/AccessibleDataTable";
import { BillingPageHeader } from "@/components/billing/BillingPageChrome";
import { requireAuth } from "@/lib/auth/guards";
import { formatAud } from "@/lib/billing/money";
import { prisma } from "@/lib/prisma";

export default async function BillingPaymentsPage() {
  const user = await requireAuth();

  const payments = await prisma.billingPayment
    .findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        method: true,
        amountCents: true,
        paidAt: true,
        createdAt: true,
        invoice: { select: { invoiceNumber: true, id: true } },
      },
    })
    .catch(() => []);

  const rows = payments.map((p) => ({
    id: p.id,
    status: p.status,
    method: p.method,
    amountCents: p.amountCents,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
    invoiceLabel: p.invoice.invoiceNumber ?? p.invoice.id.slice(0, 8),
  }));

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Payments"
        description="Card, plan-managed, and recorded payments against invoices."
      />

      <AccessibleDataTable
        caption="Payment records"
        rows={rows}
        emptyMessage="No payments recorded yet."
        columns={[
          {
            id: "invoice",
            header: "Invoice",
            cell: (row) => row.invoiceLabel,
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => (
              <span>Status: {row.status.replace(/_/g, " ")}</span>
            ),
          },
          {
            id: "method",
            header: "Method",
            cell: (row) => row.method.replace(/_/g, " "),
          },
          {
            id: "amount",
            header: "Amount",
            align: "right",
            cell: (row) => formatAud(row.amountCents),
          },
          {
            id: "when",
            header: "Paid",
            cell: (row) =>
              (row.paidAt ?? row.createdAt).toLocaleDateString("en-AU", {
                dateStyle: "medium",
              }),
          },
        ]}
      />
    </div>
  );
}
