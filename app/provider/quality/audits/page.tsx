import Link from "next/link";

import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { qualityAccreditationConfig } from "@/lib/config/quality-accreditation";
import { getProviderOrganisationIds } from "@/lib/engagement/engagement-access";
import { listAuditPlans } from "@/lib/quality/audits/audit-service";

export const metadata = { title: "Audits | Quality" };

export default async function ProviderQualityAuditsPage() {
  const user = await requireAuth();
  await requirePermission("engagement:provider:read");

  if (!qualityAccreditationConfig.qmsEnabled) {
    return <p>Quality QMS is disabled.</p>;
  }

  const orgIds = await getProviderOrganisationIds(user.id);
  const orgId = orgIds[0];
  const plans = orgId ? await listAuditPlans(orgId) : [];

  return (
    <div className="space-y-6">
      <header>
        <Link href="/provider/quality" className="text-sm underline">
          ← Quality hub
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">Audits &amp; corrective actions</h1>
        <p className="text-muted-foreground">
          Immutable audit history — status changes are append-only.
        </p>
      </header>

      <ul className="space-y-4">
        {plans.map((plan) => (
          <li key={plan.id} className="rounded-lg border p-4">
            <p className="font-medium">
              {plan.title} — {plan.status}
            </p>
            <p className="text-sm text-muted-foreground">{plan.findings.length} findings</p>
            <ul className="mt-2 space-y-1 text-sm">
              {plan.findings.map((f) => (
                <li key={f.id}>
                  {f.title} ({f.severity}) — {f.status}
                  {f.correctiveActions.length > 0
                    ? ` · ${f.correctiveActions.length} corrective action(s)`
                    : ""}
                </li>
              ))}
            </ul>
          </li>
        ))}
        {plans.length === 0 ? (
          <li className="text-muted-foreground">No audit plans yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
