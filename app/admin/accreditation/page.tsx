import Link from "next/link";

import { AccreditationStatusBadge } from "@/components/quality/AccreditationStatusBadge";
import { listApplicationsForReview } from "@/lib/accreditation/provider-accreditation-service";
import { requireAdmin } from "@/lib/auth/guards";
import { qualityAccreditationConfig } from "@/lib/config/quality-accreditation";

export default async function AdminProviderAccreditationPage() {
  await requireAdmin();

  if (!qualityAccreditationConfig.providerAccreditationEnabled) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">
          Provider accreditation is disabled. Set MAPABLE_PROVIDER_ACCREDITATION_ENABLED=true.
        </p>
        <p className="mt-2 text-sm">
          Access Mark venue accreditation remains at{" "}
          <Link href="/admin/access/accreditation" className="underline">
            /admin/access/accreditation
          </Link>
          .
        </p>
      </div>
    );
  }

  const applications = await listApplicationsForReview();

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Provider accreditation review</h1>
        <p className="text-muted-foreground">
          Human assessors decide outcomes. CareOS only prepares evidence indexes.
        </p>
        <p className="mt-2 text-sm">
          Access Mark (venue) accreditation:{" "}
          <Link href="/admin/access/accreditation" className="underline">
            separate workflow
          </Link>
        </p>
      </header>

      <ul className="space-y-3">
        {applications.map((app) => (
          <li key={app.id}>
            <Link
              href={`/admin/accreditation/${app.id}`}
              className="block rounded-lg border p-4 hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{app.organisation.name}</span>
                <AccreditationStatusBadge status={app.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {app.framework.name} v{app.framework.version}
              </p>
            </Link>
          </li>
        ))}
        {applications.length === 0 ? (
          <li className="text-muted-foreground">No applications awaiting review.</li>
        ) : null}
      </ul>
    </div>
  );
}
