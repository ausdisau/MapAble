import Link from "next/link";

import { ProviderCiRegister } from "@/components/provider/ProviderEngagementClient";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { isEngagementPlatformEnabled } from "@/lib/config/engagement";
import { getProviderOrganisationIds } from "@/lib/engagement/engagement-access";

export const metadata = { title: "CI register | Provider" };

export default async function ProviderImprovementsPage() {
  const user = await requireAuth();
  await requirePermission("engagement:provider:read");

  if (!isEngagementPlatformEnabled()) {
    return <p>Engagement platform is disabled.</p>;
  }

  const orgIds = await getProviderOrganisationIds(user.id);
  const orgId = orgIds[0];
  if (!orgId) return <p>No organisation linked.</p>;

  return (
    <div className="space-y-6">
      <header>
        <Link href="/provider/engagement" className="text-sm text-primary hover:underline">
          ← Engagement
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">
          Continuous improvement register
        </h1>
        <p className="text-sm text-muted-foreground">
          Bidirectional linkage between complaints and improvement actions.
        </p>
      </header>
      <ProviderCiRegister organisationId={orgId} />
    </div>
  );
}
