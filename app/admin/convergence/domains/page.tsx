import { redirect } from "next/navigation";

import {
  ConvergenceDataTable,
} from "@/components/admin/convergence/ConvergenceDataTable";
import { ConvergenceShell } from "@/components/admin/convergence/ConvergenceShell";
import { isConvergenceDomainRegistryEnabled } from "@/lib/config/convergence-os";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Domains | ConvergenceOS" };

export default async function ConvergenceDomainsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  if (!isConvergenceDomainRegistryEnabled()) redirect("/admin");

  const { status, q } = await searchParams;
  const domains = await prisma.canonicalDomain.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { domainKey: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return (
    <ConvergenceShell
      title="Canonical domains"
      description="One authoritative model per core concept. Status distinguishes canonical, interim, target, adapter, duplicate, and deprecated."
    >
      <form className="flex flex-wrap gap-2" method="get">
        <label className="sr-only" htmlFor="domain-q">
          Search domains
        </label>
        <input
          id="domain-q"
          name="q"
          defaultValue={q}
          placeholder="Search name or key"
          className="min-h-11 rounded-lg border border-input px-3"
        />
        <label className="sr-only" htmlFor="domain-status">
          Status filter
        </label>
        <input
          id="domain-status"
          name="status"
          defaultValue={status}
          placeholder="Status e.g. canonical"
          className="min-h-11 rounded-lg border border-input px-3"
        />
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground"
        >
          Filter
        </button>
      </form>

      <ConvergenceDataTable
        caption="Canonical domain registry"
        rows={domains}
        columns={[
          { key: "key", header: "Key", cell: (d) => d.domainKey },
          { key: "name", header: "Name", cell: (d) => d.name },
          { key: "status", header: "Status", cell: (d) => d.status },
          {
            key: "model",
            header: "Canonical model",
            cell: (d) => d.canonicalModel ?? "—",
          },
          {
            key: "programme",
            header: "Programme",
            cell: (d) => d.owningProgramme ?? "—",
          },
          {
            key: "path",
            header: "Authoritative path",
            cell: (d) => d.authoritativePath ?? "—",
          },
        ]}
      />
    </ConvergenceShell>
  );
}
