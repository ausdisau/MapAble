import { requireApiPermission } from "@/lib/api/auth-handler";
import {
  OrganisationAccessError,
  assertOrganisationAccess,
} from "@/lib/api/phase3-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createAvailabilityWindow,
  listAvailability,
} from "@/lib/availability/availability-service";
import { createAvailabilityBodySchema } from "@/lib/validation/org-transport";

export async function GET(req: Request) {
  const user = await requireApiPermission("availability:manage:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);

  try {
    await assertOrganisationAccess(user, orgId, "availability:manage:org");
    const windows = await listAvailability(orgId);
    return jsonOk({ windows });
  } catch (e) {
    if (e instanceof OrganisationAccessError) {
      return jsonError("Forbidden", 403);
    }
    throw e;
  }
}

export async function POST(req: Request) {
  const user = await requireApiPermission("availability:manage:org");
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const parsed = createAvailabilityBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await assertOrganisationAccess(
      user,
      parsed.data.organisationId,
      "availability:manage:org",
    );
    const window = await createAvailabilityWindow({
      organisationId: parsed.data.organisationId,
      workerProfileId: parsed.data.workerProfileId,
      driverProfileId: parsed.data.driverProfileId,
      vehicleId: parsed.data.vehicleId,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      timezone: parsed.data.timezone,
    });
    return jsonOk({ window }, 201);
  } catch (e) {
    if (e instanceof OrganisationAccessError) {
      return jsonError("Forbidden", 403);
    }
    throw e;
  }
}