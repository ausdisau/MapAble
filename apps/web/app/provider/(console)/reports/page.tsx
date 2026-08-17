import { AnalyticsPrivacyNotice } from "@/components/analytics/AnalyticsPrivacyNotice";
import { requireAuth } from "@/lib/auth/guards";

export default async function ProviderReportsPage() {
  await requireAuth();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Provider reports</h1>
      <AnalyticsPrivacyNotice />
      <p className="text-sm text-muted-foreground">
        Organisation-scoped dashboards are available when Metabase is configured.
      </p>
    </div>
  );
}
