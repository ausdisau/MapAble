import { AccessibleDataTable } from "@/components/billing/AccessibleDataTable";
import { BillingPageHeader } from "@/components/billing/BillingPageChrome";
import { requireAuth } from "@/lib/auth/guards";
import { formatAud } from "@/lib/billing/money";
import { prisma } from "@/lib/prisma";

export default async function BillingServiceRecordsPage() {
  const user = await requireAuth();

  const records = await prisma.billingServiceRecord
    .findMany({
      where: { participantId: user.id },
      orderBy: { serviceStart: "desc" },
      take: 50,
      select: {
        id: true,
        sourceType: true,
        status: true,
        serviceStart: true,
        estimatedCents: true,
        supportItemCode: true,
      },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Service records"
        description="Completed or in-progress services that can be charged to an invoice."
      />

      <AccessibleDataTable
        caption="Service records for billing"
        rows={records}
        emptyMessage="No service records yet."
        columns={[
          {
            id: "source",
            header: "Source",
            cell: (row) => row.sourceType.replace(/_/g, " "),
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => (
              <span>
                Status: {row.status.replace(/_/g, " ")}
              </span>
            ),
          },
          {
            id: "item",
            header: "Support item",
            cell: (row) => row.supportItemCode ?? "—",
          },
          {
            id: "start",
            header: "Service date",
            cell: (row) =>
              row.serviceStart.toLocaleDateString("en-AU", {
                dateStyle: "medium",
              }),
          },
          {
            id: "est",
            header: "Estimate",
            align: "right",
            cell: (row) => formatAud(row.estimatedCents),
          },
        ]}
      />
    </div>
  );
}
