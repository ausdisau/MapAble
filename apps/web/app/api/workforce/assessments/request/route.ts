import { requireApiSession } from "@/lib/api/auth-handler";
import {
  assertAssessorForWorker,
  assertProviderOrgAccess,
  assertWorkerOwnsRecord,
  loadWorkerOrThrow,
} from "@/lib/workforce/access";
import { requestCapabilityAssessment } from "@/lib/workforce/assessment-service";
import {
  guardCapabilityPassportPreview,
  handleCapabilityError,
  jsonPrivate,
  sameOrigin,
} from "@/lib/workforce/http";
import { AssessmentRequestSchema } from "@/lib/workforce/schemas";

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
  const parsed = AssessmentRequestSchema.safeParse(body);
  if (!parsed.success) return jsonPrivate({ error: "INVALID_ASSESSMENT_REQUEST" }, 400);

  try {
    const worker = await loadWorkerOrThrow(parsed.data.workerProfileId);
    if (worker.userId === actor.id) {
      await assertWorkerOwnsRecord(actor, worker);
    } else {
      try {
        await assertAssessorForWorker(actor, worker);
      } catch {
        await assertProviderOrgAccess(actor, worker);
      }
    }
    const created = await requestCapabilityAssessment({
      workerProfileId: worker.id,
      organisationId: worker.organisationId,
      kind: parsed.data.kind,
      evidenceIds: parsed.data.evidenceIds,
      scope: parsed.data.scope,
      participantId: parsed.data.participantId,
      actorUserId: actor.id,
      actorRole: actor.primaryRole,
    });
    return jsonPrivate({ case: created, aiWritePermission: false }, 201);
  } catch (error) {
    return handleCapabilityError(error);
  }
}
