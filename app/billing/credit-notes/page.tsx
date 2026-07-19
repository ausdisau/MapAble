import { AccessibleDataTable } from "@/components/billing/AccessibleDataTable";
import { BillingPageHeader } from "@/components/billing/BillingPageChrome";
import { requireAuth } from "@/lib/auth/guards";
import { formatAud } from "@/lib/billing/money";
import { prisma } from "@/lib/prisma";

export default async function BillingCreditNotesPage() {
  const user = await requireAuth();

  const notes = await prisma.billingCreditNote
    .findMany({
      where: { invoice: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        creditNoteNumber: true,
        status: true,
        amountCents: true,
        reason: true,
        createdAt: true,
        invoice: { select: { invoiceNumber: true, id: true } },
      },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Credit notes"
        description="Credits applied against invoices after adjustments or voids."
      />

      <AccessibleDataTable
        caption="Credit notes"
        rows={notes.map((n) => ({
          id: n.id,
          number: n.creditNoteNumber ?? n.id.slice(0, 8),
          invoiceLabel: n.invoice.invoiceNumber ?? n.invoice.id.slice(0, 8),
          status: n.status,
          amountCents: n.amountCents,
          reason: n.reason,
          createdAt: n.createdAt,
        }))}
        emptyMessage="No credit notes yet."
        columns={[
          {
            id: "number",
            header: "Credit note",
            cell: (row) => row.number,
          },
          {
            id: "invoice",
            header: "Invoice",
            cell: (row) => row.invoiceLabel,
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
            id: "reason",
            header: "Reason",
            cell: (row) => row.reason,
          },
        ]}
      />
    </div>
  );
}
