import Link from "next/link";

import { AccessibleDataTable } from "@/components/billing/AccessibleDataTable";
import { BillingPageHeader } from "@/components/billing/BillingPageChrome";
import { InvoiceStatusBadge } from "@/components/billing/InvoiceStatusBadge";
import { requireAuth } from "@/lib/auth/guards";
import { formatAud } from "@/lib/billing/money";
import { prisma } from "@/lib/prisma";
import type { BillingInvoiceState } from "@/types/billing";

export default async function BillingInvoicesPage() {
  const user = await requireAuth();

  const invoices = await prisma.billingInvoice
    .findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalCents: true,
        createdAt: true,
        dueAt: true,
      },
    })
    .catch(() => []);

  const rows = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber ?? inv.id.slice(0, 8),
    status: inv.status as BillingInvoiceState,
    totalCents: inv.totalCents,
    createdAt: inv.createdAt,
    dueAt: inv.dueAt,
  }));

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Invoices"
        description="Draft, issued, and paid invoices for your account."
      />

      <AccessibleDataTable
        caption="Your billing invoices"
        rows={rows}
        emptyMessage="No invoices yet."
        columns={[
          {
            id: "number",
            header: "Invoice",
            cell: (row) => (
              <Link
                href={`/billing/invoices/${row.id}`}
                className="font-semibold text-[#005B7F] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40"
              >
                {row.invoiceNumber}
              </Link>
            ),
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => (
              <InvoiceStatusBadge status={row.status} showDescription={false} />
            ),
          },
          {
            id: "total",
            header: "Total",
            align: "right",
            cell: (row) => formatAud(row.totalCents),
          },
          {
            id: "created",
            header: "Created",
            cell: (row) =>
              row.createdAt.toLocaleDateString("en-AU", { dateStyle: "medium" }),
          },
        ]}
      />
    </div>
  );
}
