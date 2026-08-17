import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function DisasterRecoveryPage() {
  await requireAdmin();
  const exercises = await prisma.disasterRecoveryExercise.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Disaster recovery</h1>
      <p className="text-muted-foreground">
        Exercise records are evidence — not checklist theatre.
      </p>
      <ul className="space-y-2">
        {exercises.map((e) => (
          <li key={e.id} className="rounded-lg border p-3">
            {e.title} — {e.status}
            {e.outcome && <p className="text-sm">{e.outcome}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
