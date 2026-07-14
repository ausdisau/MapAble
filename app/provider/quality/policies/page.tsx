import Link from "next/link";

import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { qualityAccreditationConfig } from "@/lib/config/quality-accreditation";
import { getProviderOrganisationIds } from "@/lib/engagement/engagement-access";
import {
  listPolicyDocuments,
  listTrainingRequirements,
} from "@/lib/quality/policies/policy-service";

export const metadata = { title: "Policies & training | Quality" };

export default async function ProviderQualityPoliciesPage() {
  const user = await requireAuth();
  await requirePermission("engagement:provider:read");

  if (!qualityAccreditationConfig.qmsEnabled) {
    return <p>Quality QMS is disabled.</p>;
  }

  const orgIds = await getProviderOrganisationIds(user.id);
  const orgId = orgIds[0];
  const [policies, requirements] = orgId
    ? await Promise.all([
        listPolicyDocuments(orgId),
        listTrainingRequirements(orgId),
      ])
    : [[], []];

  return (
    <div className="space-y-6">
      <header>
        <Link href="/provider/quality" className="text-sm underline">
          ← Quality hub
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">Policies &amp; training</h1>
        <p className="text-muted-foreground">
          Policy acknowledgements and training completion records (distinct from worker competency modules).
        </p>
      </header>

      <section>
        <h2 className="font-semibold">Policy documents</h2>
        <ul className="mt-3 space-y-2">
          {policies.map((p) => (
            <li key={p.id} className="rounded-lg border p-3 text-sm">
              {p.title} v{p.version} — {p.status}
              <span className="text-muted-foreground">
                {" "}
                · {p.acknowledgements.length} recent acknowledgement(s)
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold">Training requirements</h2>
        <ul className="mt-3 space-y-2">
          {requirements.map((r) => (
            <li key={r.id} className="rounded-lg border p-3 text-sm">
              {r.title}
              {r.renewalDays ? ` · renew every ${r.renewalDays} days` : ""}
              <span className="text-muted-foreground">
                {" "}
                · {r.completions.length} completion record(s)
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
