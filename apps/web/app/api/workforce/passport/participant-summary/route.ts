import { requireApiSession } from "@/lib/api/auth-handler";
import { buildParticipantRightsSnapshot } from "@/lib/intelligence/careos/context/participant-rights";
import { assertParticipantSelf, loadWorkerOrThrow } from "@/lib/workforce/access";
import {
  guardCapabilityPassportPreview,
  handleCapabilityError,
  jsonPrivate,
} from "@/lib/workforce/http";
import { evaluatePassportReadiness } from "@/lib/workforce/passport-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gated = guardCapabilityPassportPreview();
  if (gated) return gated;
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  const url = new URL(request.url);
  const workerProfileId = url.searchParams.get("workerProfileId") ?? "";
  const participantId = url.searchParams.get("participantId") ?? actor.id;
  if (!workerProfileId) {
    return jsonPrivate({ error: "WORKER_REQUIRED" }, 400);
  }

  try {
    await assertParticipantSelf(actor, participantId);
    const worker = await loadWorkerOrThrow(workerProfileId);
    const rights = await buildParticipantRightsSnapshot(actor.id);
    if (rights.blockedWorkerIds.includes(worker.id)) {
      return jsonPrivate({
        limitedReasons: ["This worker is not available under your recorded preferences."],
        fullFile: false,
      });
    }
    const result = await evaluatePassportReadiness({
      workerProfileId: worker.id,
      actorUserId: actor.id,
      actorRole: actor.primaryRole,
      participantId: actor.id,
      explainWithAi: false,
    });
    return jsonPrivate({
      workerProfileId: worker.id,
      limitedReasons: result.participantLimitedReasons,
      fullFile: false,
      screeningNumbers: null,
      clinicalDetail: null,
    });
  } catch (error) {
    return handleCapabilityError(error);
  }
}
