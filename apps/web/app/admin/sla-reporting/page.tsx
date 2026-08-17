import { requireAdmin } from "@/lib/auth/guards";
import { getSlaReportsDashboard } from "@/lib/reporting/sla/sla-service";

export default async function SlaReportingPage() {
  await requireAdmin();
  const reports = await getSlaReportsDashboard();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">SLA reporting</h1>
      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.id} className="rounded border p-3">
            {r.periodStart.toLocaleDateString("en-AU")} –{" "}
            {r.periodEnd.toLocaleDateString("en-AU")} — {r.status} —{" "}
            {r.availabilityPercent ?? "n/a"}% avail
          </li>
        ))}
      </ul>
    </div>
  );
}
