import { AccessibleDataTable } from "@/components/billing/AccessibleDataTable";
import {
  BillingPageHeader,
  SimulatedIntegrationNote,
} from "@/components/billing/BillingPageChrome";
import { requireAuth } from "@/lib/auth/guards";
import { formatAud } from "@/lib/billing/money";
import { prisma } from "@/lib/prisma";

export default async function BillingClaimsPage() {
  await requireAuth();

  const batches = await prisma.billingClaimBatch
    .findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        simulated: true,
        gateway: true,
        externalReference: true,
        createdAt: true,
        items: { select: { amountCents: true } },
      },
    })
    .catch(() => []);

  const rows = batches.map((b) => ({
    id: b.id,
    status: b.status,
    simulated: b.simulated,
    gateway: b.gateway,
    externalReference: b.externalReference,
    createdAt: b.createdAt,
    totalCents: b.items.reduce((s, i) => s + i.amountCents, 0),
  }));

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Claims"
        description="NDIS and agency claim batches prepared from approved invoices."
      />

      <SimulatedIntegrationNote name="Claims gateway" />

      <AccessibleDataTable
        caption="Claim batches"
        rows={rows}
        emptyMessage="No claim batches yet."
        columns={[
          {
            id: "id",
            header: "Batch",
            cell: (row) => row.externalReference ?? row.id.slice(0, 8),
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => (
              <span>
                Status: {row.status.replace(/_/g, " ")}
                {row.simulated ? " (simulated)" : ""}
              </span>
            ),
          },
          {
            id: "gateway",
            header: "Gateway",
            cell: (row) => String(row.gateway),
          },
          {
            id: "total",
            header: "Amount",
            align: "right",
            cell: (row) => formatAud(row.totalCents),
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
    </div>
  );
}
