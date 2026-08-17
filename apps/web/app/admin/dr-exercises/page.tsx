import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function DrExercisesAdminPage() {
  await requireAdmin();
  const exercises = await prisma.disasterRecoveryExercise.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const steps = await prisma.disasterRecoveryExerciseStep.findMany({
    where: { exerciseId: { in: exercises.map((e) => e.id) } },
  });
  const stepCountByExercise = steps.reduce<Record<string, number>>((acc, s) => {
    acc[s.exerciseId] = (acc[s.exerciseId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">DR exercise automation</h1>
      <p className="text-muted-foreground">
        Automated steps produce evidence only — human sign-off still required. POST
        /api/admin/dr-exercises to run a new exercise.
      </p>
      <ul className="space-y-3">
        {exercises.map((e) => (
          <li key={e.id} className="rounded-lg border p-4">
            <strong>{e.title}</strong>
            <span className="ml-2 text-sm">({e.status})</span>
            <p className="text-sm">{e.outcome}</p>
            <p className="text-xs text-muted-foreground">
              {stepCountByExercise[e.id] ?? 0} automated steps recorded
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
