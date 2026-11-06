import { notFound } from "next/navigation";

import { DomainPreviewForm } from "./_components/DomainPreviewForm";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { isDomainPreviewEnabled } from "@/lib/provider-cloud/domains/preview";

export const dynamic = "force-dynamic";
export const metadata = { title: "Domain Manager preview | MapAble ProviderCloud" };

export default async function ProviderCloudDomainsPage() {
  if (!isDomainPreviewEnabled()) notFound();
  const actor = await requireAuth();
  if (!actor.roles.includes("provider_admin")) notFound();

  const memberships = await prisma.organisationMember.findMany({
    where: { userId: actor.id },
    include: { organisation: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  const organisations = memberships.map((membership) => ({
    id: membership.organisation.id,
    name: membership.organisation.name,
  }));

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">ProviderCloud Domain Manager</h1>
        <p className="max-w-3xl text-muted-foreground">
          Synthetic planning preview only. No real domains are registered, no DNS
          records are changed, and no websites are published.
        </p>
      </header>
      {organisations.length ? (
        <DomainPreviewForm organisations={organisations} />
      ) : (
        <p role="status">
          No provider organisation membership was found. Ask an authorised
          organisation administrator for access.
        </p>
      )}
    </main>
  );
}
