import { AccessibleDataTable } from "@/components/billing/AccessibleDataTable";
import {
  BillingEmptyState,
  BillingPageHeader,
  SimulatedIntegrationNote,
} from "@/components/billing/BillingPageChrome";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function BillingIntegrationsPage() {
  await requireAuth();

  const connections = await prisma.billingIntegrationConnection
    .findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        provider: true,
        status: true,
        lastSyncAt: true,
        lastError: true,
      },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Integrations"
        description="Accounting and claims connectors used by the Billing Centre."
      />

      <SimulatedIntegrationNote name="Xero sync" />
      <SimulatedIntegrationNote name="Claims gateway" />

      {connections.length === 0 ? (
        <BillingEmptyState title="No connections">
          Connect Xero or a claims gateway from organisation settings when
          available. Until then, exports stay in MapAble and claim submissions
          run in simulated mode.
        </BillingEmptyState>
      ) : (
        <AccessibleDataTable
          caption="Integration connections"
          rows={connections}
          columns={[
            {
              id: "provider",
              header: "Provider",
              cell: (row) => row.provider,
            },
            {
              id: "status",
              header: "Status",
              cell: (row) => (
                <span>Status: {row.status.replace(/_/g, " ")}</span>
              ),
            },
            {
              id: "sync",
              header: "Last sync",
              cell: (row) =>
                row.lastSyncAt
                  ? row.lastSyncAt.toLocaleString("en-AU")
                  : "Never",
            },
            {
              id: "error",
              header: "Last error",
              cell: (row) => row.lastError ?? "—",
            },
          ]}
        />
      )}
    </div>
  );
}
