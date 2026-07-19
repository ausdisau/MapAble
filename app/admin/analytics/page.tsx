import { AnalyticsPrivacyNotice } from "@/components/analytics/AnalyticsPrivacyNotice";
import { DeidentificationBadge } from "@/components/data-governance/DeidentificationBadge";
import { isMetabaseEnabled } from "@/lib/analytics/metabase/metabase-client";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Analytics</h1>
      <DeidentificationBadge />
      <AnalyticsPrivacyNotice />
      <p className="text-sm">
        Metabase: {isMetabaseEnabled() ? "enabled" : "disabled — set METABASE_ENABLED=true"}
      </p>
    </div>
  );
}
