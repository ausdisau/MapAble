import Link from "next/link";

import { ProviderComplaintsRegister } from "@/components/provider/ProviderEngagementClient";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { getProviderOrganisationIds } from "@/lib/engagement/engagement-access";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Complaints register | Provider" };

export default async function ProviderComplaintsPage() {
  await requireAuth();
  await requirePermission("engagement:provider:read");

  if (!isEngagementPlatformEnabled()) {
    return <p>Engagement platform is disabled.</p>;
  }

  const user = await requireAuth();
  const orgIds = await getProviderOrganisationIds(user.id);
  const orgId = orgIds[0];
  if (!orgId) {
    return <p>No organisation linked to your account.</p>;
  }

  const org = await prisma.organisation.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  return (
    <div className="space-y-6">
      <header>
        <Link href="/provider/engagement" className="text-sm text-primary hover:underline">
          ← Engagement
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">Complaints register</h1>
        <p className="text-sm text-muted-foreground">
          Audit-ready register for {org?.name}. NDIS Practice Standard 1.5(1).
        </p>
      </header>
      <ProviderComplaintsRegister organisationId={orgId} />
    </div>
  );
}
