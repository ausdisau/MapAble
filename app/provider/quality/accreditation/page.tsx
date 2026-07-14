import Link from "next/link";

import { AccreditationStatusBadge } from "@/components/quality/AccreditationStatusBadge";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { qualityAccreditationConfig } from "@/lib/config/quality-accreditation";
import { listApplicationsForOrganisation } from "@/lib/accreditation/provider-accreditation-service";
import { getProviderOrganisationIds } from "@/lib/engagement/engagement-access";

export const metadata = { title: "Accreditation | Provider" };

export default async function ProviderAccreditationPage() {
  const user = await requireAuth();
  await requirePermission("engagement:provider:read");

  if (!qualityAccreditationConfig.providerAccreditationEnabled) {
    return (
      <p className="text-muted-foreground">
        Provider accreditation is disabled. Set MAPABLE_PROVIDER_ACCREDITATION_ENABLED=true.
      </p>
    );
  }

  const orgIds = await getProviderOrganisationIds(user.id);
  const orgId = orgIds[0];
  const applications = orgId
    ? await listApplicationsForOrganisation(orgId)
    : [];

  return (
    <div className="space-y-6">
      <header>
        <Link href="/provider/quality" className="text-sm underline">
          ← Quality hub
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">Provider accreditation</h1>
        <p className="text-muted-foreground">
          Submit evidence for human assessor review. CareOS prepares evidence indexes only.
          Optionally link Access Mark venue accreditation.
        </p>
      </header>

      <ul className="space-y-3">
        {applications.map((app) => (
          <li key={app.id} className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {app.framework.name} v{app.framework.version}
              </p>
              <AccreditationStatusBadge status={app.status} />
            </div>
            {app.decisions[0] ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Latest decision: {app.decisions[0].outcome}
              </p>
            ) : null}
          </li>
        ))}
        {applications.length === 0 ? (
          <li className="text-muted-foreground">No accreditation applications yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
