import { AccessibleDataTable } from "@/components/billing/AccessibleDataTable";
import { BillingPageHeader } from "@/components/billing/BillingPageChrome";
import { requireAuth } from "@/lib/auth/guards";
import { formatAud } from "@/lib/billing/money";
import { prisma } from "@/lib/prisma";

export default async function BillingProviderPayoutsPage() {
  await requireAuth();

  const payouts = await prisma.billingCentreProviderPayout
    .findMany({
      orderBy: { periodEnd: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        grossCents: true,
        netPayableCents: true,
        organisation: { select: { name: true } },
      },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Provider payouts"
        description="Calculated and released remittances to provider organisations."
      />

      <AccessibleDataTable
        caption="Provider payout runs"
        rows={payouts}
        emptyMessage="No provider payouts yet."
        columns={[
          {
            id: "org",
            header: "Organisation",
            cell: (row) => row.organisation.name,
          },
          {
            id: "period",
            header: "Period",
            cell: (row) =>
              `${row.periodStart.toLocaleDateString("en-AU")} – ${row.periodEnd.toLocaleDateString("en-AU")}`,
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => (
              <span>Status: {String(row.status).replace(/_/g, " ")}</span>
            ),
          },
          {
            id: "gross",
            header: "Gross",
            align: "right",
            cell: (row) => formatAud(row.grossCents),
          },
          {
            id: "net",
            header: "Net payable",
            align: "right",
            cell: (row) => formatAud(row.netPayableCents),
          },
        ]}
      />
    </div>
  );
}
