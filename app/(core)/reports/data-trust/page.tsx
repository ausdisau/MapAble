import { ACCOUNTABILITY_TRANSPARENCY_DISCLAIMER } from "@/lib/config/y5-rights-infrastructure";
import { listPublishedAnnualReports } from "@/lib/platform/institutional-permanence/permanence-service";

export default async function DataTrustReportsPage() {
  const reports = await listPublishedAnnualReports();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Data trust annual reports</h1>
      <p className="text-sm text-muted-foreground">{ACCOUNTABILITY_TRANSPARENCY_DISCLAIMER}</p>
      <ul className="space-y-4">
        {reports.map((r) => (
          <li key={r.id} className="rounded-lg border p-4">
            <h2 className="font-semibold">{r.title}</h2>
            <p className="text-sm">{r.summary}</p>
            <p className="text-xs text-muted-foreground">{r.yearLabel}</p>
          </li>
        ))}
        {reports.length === 0 ? (
          <li className="text-sm text-muted-foreground">No reports published.</li>
        ) : null}
      </ul>
    </div>
  );
}
