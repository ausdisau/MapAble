import Link from "next/link";

import {
  AdminCareAssignProvider,
  type AssignableOrganisation,
} from "@/components/admin/AdminCareAssignProvider";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth/guards";
import { evaluateProviderServiceReady } from "@/lib/onboarding/provider-service-ready";
import { prisma } from "@/lib/prisma";

const ASSIGNABLE_STATUSES = ["submitted", "awaiting_admin_review"] as const;

export default async function AdminCareDetailPage({
  params,
}: {
  params: Promise<{ careRequestId: string }>;
}) {
  await requireAdmin();
  const { careRequestId } = await params;
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    include: {
      assignedOrganisation: { select: { id: true, name: true } },
      shifts: { select: { id: true } },
      participant: { select: { name: true, email: true } },
    },
  });
  if (!request) return <p>Not found</p>;

  const orgs = await prisma.organisation.findMany({
    where: { status: "active" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const assignableOrganisations: AssignableOrganisation[] = await Promise.all(
    orgs.map(async (org) => {
      const evaluation = await evaluateProviderServiceReady(org.id);
      return {
        id: org.id,
        name: org.name,
        serviceReady: evaluation.serviceReady,
        blockerLabels: evaluation.checklist
          .filter((item) => item.blocker && !item.complete)
          .map((item) => item.label),
      };
    })
  );

  const canAssign = ASSIGNABLE_STATUSES.includes(
    request.status as (typeof ASSIGNABLE_STATUSES)[number]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/admin/service-ops/care" className="hover:underline">
              Care ops queue
            </Link>
            {" · "}
            <Link href="/admin/care" className="hover:underline">
              All care requests
            </Link>
          </p>
          <h1 className="font-heading text-2xl font-bold">{request.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {request.participant.name ?? request.participant.email}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <section className="space-y-2 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Request details</h2>
        <p className="text-sm">{request.description}</p>
        {request.address ? (
          <p className="text-sm text-muted-foreground">{request.address}</p>
        ) : null}
      </section>

      <section className="space-y-2 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Assignment</h2>
        <p className="text-sm text-muted-foreground">
          Assigned provider:{" "}
          {request.assignedOrganisation?.name ?? "None — awaiting dispatch"}
        </p>
        <p className="text-sm text-muted-foreground">
          Shifts: {request.shifts.length}
        </p>
      </section>

      <AdminCareAssignProvider
        careRequestId={request.id}
        currentOrganisationId={request.assignedOrganisationId}
        assignableOrganisations={assignableOrganisations}
        canAssign={canAssign}
      />
    </div>
  );
}
