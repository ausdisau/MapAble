import { requireApiPermission } from "@/lib/api/auth-handler";
import { OrganisationAccessError } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { deactivateWorkerProfile } from "@/lib/workers/worker-invite-service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; workerId: string }> },
) {
  const user = await requireApiPermission("worker:manage:org");
  if (user instanceof Response) return user;

  const { id: organisationId, workerId } = await params;
  const body = (await req.json()) as { active?: boolean };

  if (typeof body.active !== "boolean") {
    return jsonError("active boolean is required", 400);
  }

  try {
    const profile = await deactivateWorkerProfile({
      organisationId,
      workerProfileId: workerId,
      active: body.active,
      actor: user,
    });
    return jsonOk({ profile });
  } catch (e) {
    if (e instanceof OrganisationAccessError) {
      return jsonError(
        e.message === "NOT_FOUND" ? "Not found" : "Forbidden",
        403,
      );
    }
    throw e;
  }
}
