import { GovernmentReportingClient } from "@/components/admin/GovernmentReportingClient";
import { requireAdmin } from "@/lib/auth/guards";
import { phase6Config } from "@/lib/config/phase6";

export default async function GovernmentReportingPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Government reporting</h1>
      <p className="text-muted-foreground">
        Draft report packs for council or program summaries. Nothing is auto-submitted
        to government systems.
      </p>
      {!phase6Config.governmentReportingEnabled ? (
        <p className="rounded-lg border p-4 text-sm">
          Set GOVERNMENT_REPORTING_ENABLED=true to draft packs in staging.
        </p>
      ) : (
        <GovernmentReportingClient />
      )}
    </div>
  );
}
