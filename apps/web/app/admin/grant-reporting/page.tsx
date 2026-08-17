import { requireAdmin } from "@/lib/auth/guards";
import { getGrantReportsDashboard } from "@/lib/reporting/grant/grant-service";

export default async function GrantReportingPage() {
  await requireAdmin();
  const reports = await getGrantReportsDashboard();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Grant reporting</h1>
      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.id} className="rounded border p-3">
            {r.grantCode} — {r.periodLabel} ({r.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
