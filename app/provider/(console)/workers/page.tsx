import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { ProviderWorkerInviteForm } from "@/components/provider/ProviderWorkerInviteForm";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export default async function ProviderWorkersPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const user = await requireAuth();
  const { invite } = await searchParams;
  const showInvite = invite === "1";
  const canManage = hasPermission(user.primaryRole, "worker:manage:org");
  const orgIds = await getUserOrganisationIds(user.id);

  const [workers, organisations] = await Promise.all([
    canManage
      ? prisma.workerProfile.findMany({
          where: { organisationId: { in: orgIds } },
          orderBy: [{ active: "desc" }, { displayName: "asc" }],
        })
      : Promise.resolve([]),
    canManage
      ? prisma.organisation.findMany({
          where: { id: { in: orgIds } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Workers</h1>
          <p className="text-muted-foreground">
            Support workers associated with your organisation.
          </p>
        </div>
        {canManage && !showInvite ? (
          <Link
            href="/provider/workers?invite=1"
            className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Invite worker
          </Link>
        ) : null}
      </div>

      {canManage && showInvite && organisations.length > 0 ? (
        <section className="rounded-xl border border-border/60 p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Invite worker</h2>
            <Link href="/provider/workers" className="text-sm text-primary underline">
              Cancel
            </Link>
          </div>
          <ProviderWorkerInviteForm organisations={organisations} />
        </section>
      ) : null}

      {workers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
          <p className="text-muted-foreground">No workers on your roster yet.</p>
          {canManage && !showInvite ? (
            <Link
              href="/provider/workers?invite=1"
              className="mt-4 inline-block text-primary underline"
            >
              Invite your first worker
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y rounded-xl border border-border/60">
          {workers.map((w) => (
            <li
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <Link
                  href={`/provider/workers/${w.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {w.displayName}
                </Link>
                {!w.active ? (
                  <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusTextBadge status={w.verificationStatus} />
                <StatusTextBadge status={w.workerScreeningStatus} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
