import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function BoardReportingPage() {
  await requireAdmin();
  const reports = await prisma.boardReportSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Board reporting</h1>
      <p className="text-muted-foreground">
        Aggregate operational, safety and impact metrics only.
      </p>
      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.id} className="rounded-lg border p-3 text-sm">
            Period {r.reportPeriod} — {r.createdAt.toLocaleDateString("en-AU")}
          </li>
        ))}
      </ul>
    </div>
  );
}
