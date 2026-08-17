import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Organisations | Admin" };

export default async function AdminOrganisationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const organisations = await prisma.organisation.findMany({
    where: {
      ...(q
        ? { name: { contains: q, mode: "insensitive" } }
        : {}),
      ...(status
        ? { verificationStatus: status as never }
        : {}),
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold">Organisations</h1>
        <Link
          href="/admin/organisations/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground"
        >
          Add organisation
        </Link>
      </header>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name"
          className="min-h-11 rounded-lg border border-input px-3"
        />
        <select
          name="status"
          defaultValue={status}
          className="min-h-11 rounded-lg border border-input px-3"
        >
          <option value="">All verification statuses</option>
          <option value="pending_review">Pending review</option>
          <option value="verified">Verified</option>
        </select>
        <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">
          Filter
        </button>
      </form>

      <ul className="space-y-2">
        {organisations.map((o) => (
          <li key={o.id}>
            <Link
              href={`/admin/organisations/${o.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40"
            >
              <span className="font-medium">{o.name}</span>
              <StatusBadge status={o.verificationStatus} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
