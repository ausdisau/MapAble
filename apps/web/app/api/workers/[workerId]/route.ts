import { requireApiSession } from "@/lib/api/auth-handler";
import {
  OrganisationAccessError,
  assertWorkerProfileRead,
  assertWorkerProfileWrite,
} from "@/lib/api/organisation-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

const SELF_EDITABLE_FIELDS = [
  "displayName",
  "profileSummary",
  "serviceTypes",
  "serviceRegions",
  "languages",
] as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ workerId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { workerId } = await params;

  try {
    const access = await assertWorkerProfileRead(user, workerId);
    return jsonOk({ profile: access.profile });
  } catch (e) {
    if (e instanceof OrganisationAccessError) {
      return jsonError(e.message === "NOT_FOUND" ? "Not found" : "Forbidden", 404);
    }
    throw e;
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workerId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { workerId } = await params;
  const body = await req.json();

  try {
    const access = await assertWorkerProfileWrite(user, workerId);
    const data: Record<string, unknown> = {};

    for (const field of SELF_EDITABLE_FIELDS) {
      if (body[field] !== undefined) {
        if (!access.canManage && !access.isOwner) {
          return jsonError("Forbidden", 403);
        }
        data[field] = body[field];
      }
    }

    if (Object.keys(data).length === 0) {
      return jsonError("No editable fields provided", 400);
    }

    const profile = await prisma.workerProfile.update({
      where: { id: workerId },
      data,
    });

    await createAuditEvent({
      actorUserId: user.id,
      action: "worker_profile.updated",
      entityType: "WorkerProfile",
      entityId: workerId,
      organisationId: profile.organisationId,
      metadata: { fields: Object.keys(data) },
    });

    return jsonOk({ profile });
  } catch (e) {
    if (e instanceof OrganisationAccessError) {
      return jsonError(e.message === "NOT_FOUND" ? "Not found" : "Forbidden", 403);
    }
    throw e;
  }
}
