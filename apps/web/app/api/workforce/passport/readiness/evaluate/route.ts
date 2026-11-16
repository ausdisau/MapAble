import { requireApiSession } from "@/lib/api/auth-handler";
import { prisma } from "@/lib/prisma";
import {
  assertAssessorForWorker,
  assertParticipantSelf,
  assertProviderOrgAccess,
  assertWorkerOwnsRecord,
  loadWorkerOrThrow,
} from "@/lib/workforce/access";
import {
  guardCapabilityPassportPreview,
  handleCapabilityError,
  jsonPrivate,
  sameOrigin,
} from "@/lib/workforce/http";
import { evaluatePassportReadiness } from "@/lib/workforce/passport-service";
import { ReadinessEvaluateSchema } from "@/lib/workforce/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const gated = guardCapabilityPassportPreview();
  if (gated) return gated;
  if (!sameOrigin(request)) return jsonPrivate({ error: "Invalid request origin." }, 403);
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return jsonPrivate({ error: "Invalid JSON." }, 400);
  }
  const parsed = ReadinessEvaluateSchema.safeParse(body);
  if (!parsed.success) return jsonPrivate({ error: "INVALID_READINESS_REQUEST" }, 400);

  try {
    const worker = await loadWorkerOrThrow(parsed.data.workerProfileId);
    if (worker.userId === actor.id) {
      await assertWorkerOwnsRecord(actor, worker);
    } else if (parsed.data.participantId) {
      await assertParticipantSelf(actor, parsed.data.participantId);
    } else if (actor.roles.includes("support_worker")) {
      return jsonPrivate({ error: "WORKER_PASSPORT_FORBIDDEN" }, 403);
    } else {
      try {
        await assertAssessorForWorker(actor, worker);
      } catch {
        await assertProviderOrgAccess(actor, worker);
      }
    }

    const result = await evaluatePassportReadiness({
      workerProfileId: worker.id,
      actorUserId: actor.id,
      actorRole: actor.primaryRole,
      participantId: parsed.data.participantId,
      intensity: parsed.data.intensity,
      explainWithAi: parsed.data.explainWithAi,
    });

    if (parsed.data.participantId) {
      const profile = await prisma.participantProfile.findFirst({
        where: { userId: actor.id },
        select: { id: true },
      });
      if (profile && parsed.data.participantId !== profile.id && parsed.data.participantId !== actor.id) {
        return jsonPrivate({ error: "PARTICIPANT_SCOPE_FORBIDDEN" }, 403);
      }
      return jsonPrivate({
        limitedReasons: result.participantLimitedReasons,
        learningStillAvailable: result.learningStillAvailable,
        autoAssign: false,
      });
    }

    return jsonPrivate({ ...result, aiWritePermission: false });
  } catch (error) {
    return handleCapabilityError(error);
  }
}
