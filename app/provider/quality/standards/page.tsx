import Link from "next/link";

import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { qualityAccreditationConfig } from "@/lib/config/quality-accreditation";
import { getProviderOrganisationIds } from "@/lib/engagement/engagement-access";
import {
  listOrganisationEvidence,
  listPublishedFrameworks,
} from "@/lib/quality/standards/standards-service";

export const metadata = { title: "Standards | Quality" };

export default async function ProviderQualityStandardsPage() {
  const user = await requireAuth();
  await requirePermission("engagement:provider:read");

  if (!qualityAccreditationConfig.qmsEnabled) {
    return <p>Quality QMS is disabled.</p>;
  }

  const orgIds = await getProviderOrganisationIds(user.id);
  const orgId = orgIds[0];
  const [frameworks, evidence] = await Promise.all([
    listPublishedFrameworks(),
    orgId ? listOrganisationEvidence(orgId) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/provider/quality" className="text-sm underline">
          ← Quality hub
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">Standards registry</h1>
        <p className="text-muted-foreground">
          Versioned frameworks with source-attributable evidence.
        </p>
      </header>

      <section>
        <h2 className="font-semibold">Published frameworks</h2>
        <ul className="mt-3 space-y-2">
          {frameworks.map((f) => (
            <li key={f.id} className="rounded-lg border p-3">
              <p className="font-medium">
                {f.name} v{f.version}
              </p>
              <p className="text-sm text-muted-foreground">{f.code}</p>
              <p className="text-sm">{f.outcomes.length} outcomes</p>
            </li>
          ))}
          {frameworks.length === 0 ? (
            <li className="text-muted-foreground">No published frameworks yet.</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold">Your compliance evidence</h2>
        <ul className="mt-3 space-y-2">
          {evidence.map((e) => (
            <li key={e.id} className="rounded-lg border p-3 text-sm">
              <p>{e.requirement.code} — v{e.version}</p>
              <p className="text-muted-foreground">
                Source: {e.sourceType} · Latest assessment:{" "}
                {e.assessments[0]?.status ?? "none"}
              </p>
            </li>
          ))}
          {evidence.length === 0 ? (
            <li className="text-muted-foreground">No evidence submitted yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
