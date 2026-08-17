import { requireAdmin } from "@/lib/auth/guards";
import { listPublishedAnnualReports } from "@/lib/platform/institutional-permanence/permanence-service";
import { prisma } from "@/lib/prisma";

export default async function DataTrustReportsPage() {
  await requireAdmin();
  const published = await listPublishedAnnualReports();
  const all = await prisma.dataTrustAnnualReport.findMany({
    orderBy: { yearLabel: "desc" },
  });
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Data trust annual reports</h1>
      <p className="text-sm text-muted-foreground">
        Use Institutional Permanence admin to publish reports.
      </p>
      <p className="text-sm">{published.length} published of {all.length} total</p>
      <ul className="space-y-2">
        {all.map((r) => (
          <li key={r.id} className="rounded border p-3">
            {r.yearLabel} — {r.title} ({r.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
