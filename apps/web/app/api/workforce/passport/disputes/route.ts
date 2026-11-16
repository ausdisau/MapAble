import { requireApiSession } from "@/lib/api/auth-handler";
import { assertWorkerOwnsRecord, loadWorkerOrThrow } from "@/lib/workforce/access";
import { createEvidenceDispute } from "@/lib/workforce/assessment-service";
import {
  guardCapabilityPassportPreview,
  handleCapabilityError,
  jsonPrivate,
  sameOrigin,
} from "@/lib/workforce/http";
import { DisputeSchema } from "@/lib/workforce/schemas";

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
  const parsed = DisputeSchema.safeParse(body);
  if (!parsed.success) return jsonPrivate({ error: "INVALID_DISPUTE" }, 400);

  try {
    const worker = await loadWorkerOrThrow(parsed.data.workerProfileId);
    await assertWorkerOwnsRecord(actor, worker);
    const dispute = await createEvidenceDispute({
      workerProfileId: worker.id,
      evidenceKind: parsed.data.evidenceKind,
      evidenceId: parsed.data.evidenceId,
      reason: parsed.data.reason,
      actorUserId: actor.id,
      actorRole: actor.primaryRole,
      organisationId: worker.organisationId,
    });
    return jsonPrivate({ dispute }, 201);
  } catch (error) {
    return handleCapabilityError(error);
  }
}
