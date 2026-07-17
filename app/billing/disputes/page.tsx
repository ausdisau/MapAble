import { AccessibleDataTable } from "@/components/billing/AccessibleDataTable";
import { BillingPageHeader } from "@/components/billing/BillingPageChrome";
import { DisputeTimeline } from "@/components/billing/DisputeTimeline";
import { requireAuth } from "@/lib/auth/guards";
import { formatAud } from "@/lib/billing/money";
import { prisma } from "@/lib/prisma";

export default async function BillingDisputesPage() {
  const user = await requireAuth();

  const disputes = await prisma.billingDispute
    .findMany({
      where: { participantId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20,
          include: { author: { select: { name: true } } },
        },
        invoice: { select: { invoiceNumber: true, id: true } },
      },
    })
    .catch(() => []);

  const latest = disputes[0] ?? null;

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Disputes"
        description="Questions and holds raised on invoices. Amounts on hold are not available for payout."
      />

      <AccessibleDataTable
        caption="Open and resolved disputes"
        rows={disputes.map((d) => ({
          id: d.id,
          invoiceLabel: d.invoice.invoiceNumber ?? d.invoice.id.slice(0, 8),
          status: d.status,
          summary: d.summary,
          amountOnHoldCents: d.amountOnHoldCents,
          createdAt: d.createdAt,
        }))}
        emptyMessage="No disputes on your invoices."
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
            id: "summary",
            header: "Summary",
            cell: (row) => row.summary,
          },
          {
            id: "hold",
            header: "On hold",
            align: "right",
            cell: (row) => formatAud(row.amountOnHoldCents),
          },
          {
            id: "created",
            header: "Opened",
            cell: (row) =>
              row.createdAt.toLocaleDateString("en-AU", {
                dateStyle: "medium",
              }),
          },
        ]}
      />

      {latest ? (
        <DisputeTimeline
          statusLabel={latest.status.replace(/_/g, " ")}
          events={[
            {
              id: `open-${latest.id}`,
              label: "Dispute opened",
              body: latest.summary,
              createdAt: latest.createdAt,
            },
            ...latest.messages.map((m) => ({
              id: m.id,
              label: m.isInternal ? "Internal note" : "Message",
              body: m.body,
              isInternal: m.isInternal,
              createdAt: m.createdAt,
              authorLabel: m.author?.name ?? null,
            })),
          ]}
        />
      ) : null}
    </div>
  );
}
