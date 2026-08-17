import { AccessibleDataTable } from "@/components/billing/AccessibleDataTable";
import { BillingPageHeader } from "@/components/billing/BillingPageChrome";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function BillingSubscriptionsPage() {
  const user = await requireAuth();

  const subscriptions = await prisma.billingSubscription
    .findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        planCode: true,
        status: true,
        createdAt: true,
        currentPeriodEnd: true,
      },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <BillingPageHeader
        title="Subscriptions"
        description="Recurring MapAble and related subscription plans on your account."
      />

      <AccessibleDataTable
        caption="Subscriptions"
        rows={subscriptions}
        emptyMessage="No subscriptions yet."
        columns={[
          {
            id: "plan",
            header: "Plan",
            cell: (row) => String(row.planCode).replace(/_/g, " "),
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => (
              <span>Status: {String(row.status).replace(/_/g, " ")}</span>
            ),
          },
          {
            id: "period",
            header: "Current period ends",
            cell: (row) =>
              row.currentPeriodEnd
                ? row.currentPeriodEnd.toLocaleDateString("en-AU", {
                    dateStyle: "medium",
                  })
                : "—",
          },
          {
            id: "created",
            header: "Started",
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
