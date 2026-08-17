import Link from "next/link";
import { notFound } from "next/navigation";

import { OrganisationVerificationPanel } from "@/components/admin/OrganisationVerificationPanel";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/prisma";

export default async function AdminOrganisationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await prisma.organisation.findUnique({ where: { id } });
  if (!org) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/organisations" className="text-sm text-primary hover:underline">
        ← Organisations
      </Link>
      <header>
        <h1 className="font-heading text-2xl font-bold">{org.name}</h1>
        <StatusBadge status={org.verificationStatus} />
      </header>
      <dl className="grid max-w-xl gap-2 text-sm">
        <div>
          <dt className="font-medium">Type</dt>
          <dd>{org.organisationType}</dd>
        </div>
        <div>
          <dt className="font-medium">Contact</dt>
          <dd>{org.contactEmail ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium">NDIS registered (claimed)</dt>
          <dd>{org.ndisRegistrationClaimed ? "Yes" : "No"}</dd>
        </div>
      </dl>
      <OrganisationVerificationPanel
        organisationId={org.id}
        currentStatus={org.verificationStatus}
      />
    </div>
  );
}
