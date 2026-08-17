import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const TYPE_LABELS: Record<string, string> = {
  ndis_plan_managed: "NDIS plan-managed",
  ndis_self_managed: "NDIS self-managed",
  private_card: "Private card",
  organisation_invoice: "Organisation invoice",
  grant: "Grant",
  other: "Other",
};

export default async function BillingFundingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const source = await prisma.billingFundingSource.findFirst({
    where: { id, userId: user.id },
  });

  if (!source) {
    return (
      <div className="space-y-4">
        <p role="alert">Funding source not found.</p>
        <Link href="/dashboard/billing/funding" className="text-sm text-primary">
          Back to funding sources
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p>
        <Link
          href="/dashboard/billing/funding"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to funding sources
        </Link>
      </p>
      <header>
        <h1 className="font-heading text-2xl font-bold">{source.label}</h1>
        <p className="text-muted-foreground">
          {TYPE_LABELS[source.type] ?? source.type}
          {source.isDefault ? " · Default" : ""}
        </p>
      </header>

      <dl className="grid max-w-lg gap-3 rounded-xl border border-border bg-card p-4 text-sm">
        {source.ndisParticipantNumber ? (
          <div>
            <dt className="font-medium text-muted-foreground">NDIS participant number</dt>
            <dd>{source.ndisParticipantNumber}</dd>
          </div>
        ) : null}
        {source.planManagerName ? (
          <div>
            <dt className="font-medium text-muted-foreground">Plan manager</dt>
            <dd>{source.planManagerName}</dd>
          </div>
        ) : null}
        {source.planManagerEmail ? (
          <div>
            <dt className="font-medium text-muted-foreground">Plan manager email</dt>
            <dd>
              <a href={`mailto:${source.planManagerEmail}`} className="text-primary">
                {source.planManagerEmail}
              </a>
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="font-medium text-muted-foreground">Added</dt>
          <dd>{source.createdAt.toLocaleString("en-AU")}</dd>
        </div>
      </dl>
    </div>
  );
}
