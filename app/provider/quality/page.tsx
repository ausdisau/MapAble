import Link from "next/link";

import { QualityMetricCard } from "@/components/quality/QualityMetricCard";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { qualityAccreditationConfig } from "@/lib/config/quality-accreditation";
import { getProviderOrganisationIds } from "@/lib/engagement/engagement-access";
import { getProviderQualityDashboard } from "@/lib/quality/dashboard-service";

export const metadata = { title: "Quality QMS | Provider" };

export default async function ProviderQualityHubPage() {
  const user = await requireAuth();
  await requirePermission("engagement:provider:read");

  if (!qualityAccreditationConfig.qmsEnabled) {
    return (
      <p className="text-muted-foreground">
        Quality QMS is disabled. Set MAPABLE_QUALITY_QMS_ENABLED=true.
      </p>
    );
  }

  const orgIds = await getProviderOrganisationIds(user.id);
  const orgId = orgIds[0];
  const dashboard = orgId
    ? await getProviderQualityDashboard(orgId)
    : null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Quality &amp; compliance</h1>
        <p className="mt-2 text-muted-foreground">
          Versioned standards, audits, policies, training, and accreditation evidence.
          Human assessors decide accreditation outcomes.
        </p>
      </header>

      {dashboard ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QualityMetricCard label="Audit plans" value={dashboard.audit.plans} />
          <QualityMetricCard
            label="Open findings"
            value={dashboard.audit.openFindings}
          />
          <QualityMetricCard
            label="Published policies"
            value={dashboard.policyTraining.policies}
          />
          <QualityMetricCard
            label="Evidence items"
            value={dashboard.evidence.total}
            hint={`${dashboard.evidence.met} met`}
          />
        </div>
      ) : (
        <p>No organisation linked to your account.</p>
      )}

      <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/provider/quality/standards" className="rounded-lg border p-4 underline">
          Standards &amp; evidence
        </Link>
        <Link href="/provider/quality/audits" className="rounded-lg border p-4 underline">
          Audits &amp; corrective actions
        </Link>
        <Link href="/provider/quality/policies" className="rounded-lg border p-4 underline">
          Policies &amp; training
        </Link>
        {qualityAccreditationConfig.providerAccreditationEnabled ? (
          <Link
            href="/provider/quality/accreditation"
            className="rounded-lg border p-4 underline"
          >
            Provider accreditation
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
