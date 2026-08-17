import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AiMonitoringPage() {
  await requireAdmin();
  const snapshots = await prisma.aiMonitoringDashboardSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">AI monitoring dashboard</h1>
      <p className="text-muted-foreground">
        Fairness and governance trend snapshots — not real-time model telemetry.
      </p>
      <ul className="space-y-2">
        {snapshots.map((s) => (
          <li key={s.id} className="rounded-lg border p-3 text-sm">
            Captured {s.createdAt.toLocaleString("en-AU")}
          </li>
        ))}
      </ul>
    </div>
  );
}
