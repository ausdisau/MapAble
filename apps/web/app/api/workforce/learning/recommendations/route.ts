import { requireApiSession } from "@/lib/api/auth-handler";
import { prisma } from "@/lib/prisma";
import { assertWorkerOwnsRecord } from "@/lib/workforce/access";
import {
  guardCapabilityPassportPreview,
  handleCapabilityError,
  jsonPrivate,
} from "@/lib/workforce/http";
import { learningAvailableWithoutAi } from "@/lib/workforce/learning-catalog";
import { buildWorkerPassport, listLearningRecommendations } from "@/lib/workforce/passport-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gated = guardCapabilityPassportPreview();
  if (gated) return gated;
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  try {
    const workerProfileId = new URL(request.url).searchParams.get("workerProfileId");
    if (!workerProfileId) {
      return jsonPrivate({ aiRequired: false, items: learningAvailableWithoutAi() });
    }
    const worker = await prisma.workerProfile.findFirst({
      where: { id: workerProfileId, userId: actor.id, active: true },
    });
    if (!worker) return jsonPrivate({ error: "WORKER_PASSPORT_FORBIDDEN" }, 403);
    await assertWorkerOwnsRecord(actor, worker);
    const passport = await buildWorkerPassport({
      workerProfileId: worker.id,
      actorUserId: actor.id,
      actorRole: actor.primaryRole,
    });
    return jsonPrivate(listLearningRecommendations(passport.gaps));
  } catch (error) {
    return handleCapabilityError(error);
  }
}
