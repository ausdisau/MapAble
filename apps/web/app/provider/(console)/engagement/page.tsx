import Link from "next/link";

import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { getProviderOrganisationIds } from "@/lib/engagement/engagement-access";
import { listProviderComplaints } from "@/lib/engagement/engagement-submission-service";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Engagement | Provider" };

export default async function ProviderEngagementHubPage() {
  const user = await requireAuth();
  await requirePermission("engagement:provider:read");

  if (!isEngagementPlatformEnabled()) {
    return <p>Engagement platform is disabled.</p>;
  }

  const orgIds = await getProviderOrganisationIds(user.id);
  const orgId = orgIds[0];

  let openComplaints = 0;
  let overdueAck = 0;
  if (orgId) {
    const complaints = await listProviderComplaints(orgId);
    openComplaints = complaints.filter(
      (c) => !["closed", "improved"].includes(c.status)
    ).length;
    const now = new Date();
    overdueAck = complaints.filter(
      (c) =>
        !c.acknowledgedAt &&
        c.acknowledgementDueAt &&
        c.acknowledgementDueAt < now
    ).length;
  }

  const openCi = orgId
    ? await prisma.engagementImprovementAction.count({
        where: { organisationId: orgId, status: { not: "completed" } },
      })
    : 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Engagement &amp; compliance</h1>
        <p className="mt-2 text-muted-foreground">
          Complaints register, continuous improvement, worker training, and benchmarks.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Open complaints" value={openComplaints} />
        <Metric label="Overdue acknowledgements" value={overdueAck} />
        <Metric label="Open CI actions" value={openCi} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <HubLink href="/provider/engagement/complaints" title="Complaints register" />
        <HubLink href="/provider/engagement/improvements" title="CI register" />
        <HubLink href="/provider/engagement/training" title="Worker training" />
        <HubLink href="/provider/engagement/analytics" title="Benchmarking" />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function HubLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-border bg-card p-5 hover:border-primary/40"
    >
      <span className="font-semibold">{title}</span>
      <span className="mt-2 block text-sm text-primary">Open →</span>
    </Link>
  );
}
