import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function NationalInsightsAdminPage() {
  await requireAdmin();
  const snapshots = await prisma.nationalInsightSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">National insights</h1>
      <p className="text-muted-foreground">
        POST /api/admin/national-insights to capture a new snapshot.
      </p>
      <ul className="space-y-2">
        {snapshots.map((s) => (
          <li key={s.id} className="rounded border p-3">
            {s.periodLabel} — suppressed: {String(s.suppressed)}
          </li>
        ))}
      </ul>
    </div>
  );
}
