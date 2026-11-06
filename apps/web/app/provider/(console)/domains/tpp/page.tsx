import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { isTppWholesaleReadOnlyEnabled } from "@/lib/provider-cloud/tpp-wholesale/config";
import { TppAvailabilityForm } from "./_components/TppAvailabilityForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "TPP domain availability | MapAble ProviderCloud" };

export default async function TppDomainAvailabilityPage() {
  if (!isTppWholesaleReadOnlyEnabled()) notFound();
  const actor = await requireAuth();
  if (!actor.roles.includes("provider_admin")) notFound();
  const memberships = await prisma.organisationMember.findMany({
    where: { userId: actor.id },
    include: { organisation: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  const organisations = memberships.map((entry) => ({
    id: entry.organisation.id,
    name: entry.organisation.name,
  }));

  return (
    <main className="space-y-5">
      <h1 className="text-3xl font-semibold">TPP Wholesale domain availability</h1>
      <p className="max-w-3xl text-muted-foreground">
        This developer-only connection checks a real domain with TPP Wholesale.
        The search sends your domain name to TPP. It does not buy, register,
        renew, transfer, host, publish or change DNS for any domain.
      </p>
      {organisations.length ? (
        <TppAvailabilityForm organisations={organisations} />
      ) : (
        <p role="status">You are not a member of a provider organisation.</p>
      )}
    </main>
  );
}
