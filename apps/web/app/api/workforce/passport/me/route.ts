import { requireApiSession } from "@/lib/api/auth-handler";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { assertWorkerOwnsRecord } from "@/lib/workforce/access";
import {
  guardCapabilityPassportPreview,
  handleCapabilityError,
  jsonPrivate,
  sanitiseAuditMetadata,
  sameOrigin,
} from "@/lib/workforce/http";
import { buildWorkerPassport } from "@/lib/workforce/passport-service";
import { SharePreferenceSchema } from "@/lib/workforce/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  const gated = guardCapabilityPassportPreview();
  if (gated) return gated;
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;
  try {
    const worker = await prisma.workerProfile.findFirst({
      where: { userId: actor.id, active: true },
    });
    if (!worker) return jsonPrivate({ error: "WORKER_NOT_FOUND" }, 404);
    await assertWorkerOwnsRecord(actor, worker);
    const passport = await buildWorkerPassport({
      workerProfileId: worker.id,
      actorUserId: actor.id,
      actorRole: actor.primaryRole,
    });
    return jsonPrivate(passport);
  } catch (error) {
    return handleCapabilityError(error);
  }
}

export async function PUT(request: Request) {
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
  const parsed = SharePreferenceSchema.safeParse(body);
  if (!parsed.success) return jsonPrivate({ error: "INVALID_SHARE_PREFERENCE" }, 400);
  try {
    const worker = await prisma.workerProfile.findFirst({
      where: { userId: actor.id, active: true },
    });
    if (!worker) return jsonPrivate({ error: "WORKER_NOT_FOUND" }, 404);
    await prisma.workerPassportSharePreference.upsert({
      where: { workerProfileId: worker.id },
      create: { workerProfileId: worker.id, ...parsed.data },
      update: parsed.data,
    });
    await createAuditEvent({
      actorUserId: actor.id,
      actorRole: actor.primaryRole,
      action: "capability_passport.share_preference_updated",
      entityType: "WorkerPassportSharePreference",
      entityId: worker.id,
      organisationId: worker.organisationId,
      metadata: sanitiseAuditMetadata({ ...parsed.data }),
    });
    return jsonPrivate({ saved: true });
  } catch (error) {
    return handleCapabilityError(error);
  }
}
