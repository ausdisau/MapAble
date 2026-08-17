import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { runAutomatedDrExercise } from "@/lib/platform/dr-exercises/exercise-automation-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const exercises = await prisma.disasterRecoveryExercise.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  const steps = await prisma.disasterRecoveryExerciseStep.findMany({
    where: { exerciseId: { in: exercises.map((e) => e.id) } },
  });
  return jsonOk({ exercises, steps });
}

export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const result = await runAutomatedDrExercise(user.id);
  return jsonOk(result, 201);
}
