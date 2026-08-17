import type { WorkerCredentialStatus } from "@prisma/client";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  OrganisationAccessError,
  assertWorkerProfileWrite,
} from "@/lib/api/organisation-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { updateWorkerCredential } from "@/lib/workers/worker-profile-service";

const ALLOWED_FIELDS = [
  "workerScreeningStatus",
  "wwccStatus",
  "firstAidStatus",
  "insuranceStatus",
] as const;

const SELF_ALLOWED_STATUSES: WorkerCredentialStatus[] = [
  "not_provided",
  "pending_review",
];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ workerId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { workerId } = await params;
  const body = await req.json();

  const field = body.field as (typeof ALLOWED_FIELDS)[number] | undefined;
  const status = body.status as WorkerCredentialStatus | undefined;

  if (!field || !ALLOWED_FIELDS.includes(field)) {
    return jsonError("Invalid credential field", 400);
  }
  if (!status) {
    return jsonError("status is required", 400);
  }

  try {
    const access = await assertWorkerProfileWrite(user, workerId);

    if (!access.canManage) {
      if (!access.isOwner) return jsonError("Forbidden", 403);
      if (!SELF_ALLOWED_STATUSES.includes(status)) {
        return jsonError("Workers may only mark credentials as not provided or pending review", 403);
      }
    }

    const profile = await updateWorkerCredential(
      workerId,
      field,
      status,
      user.id
    );
    return jsonOk({ profile });
  } catch (e) {
    if (e instanceof OrganisationAccessError) {
      return jsonError(e.message === "NOT_FOUND" ? "Not found" : "Forbidden", 403);
    }
    throw e;
  }
}
