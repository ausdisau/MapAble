import { requireApiPermission } from "@/lib/api/auth-handler";
import {
  OrganisationAccessError,
  assertOrganisationAccess,
  organisationScopedIds,
} from "@/lib/api/organisation-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { BreakGlassRequiredError } from "@/lib/security/break-glass";
import { createVehicle } from "@/lib/transport/vehicle-service";
import { createVehicleBodySchema } from "@/lib/validation/org-transport";

export async function GET() {
  const user = await requireApiPermission("vehicle:manage:org");
  if (user instanceof Response) return user;

  try {
    const scope = await organisationScopedIds(user, "vehicle:manage:org");
    if (scope !== "admin_unscoped" && scope.length === 0) {
      return jsonOk({ vehicles: [] });
    }
    const vehicles = await prisma.vehicle.findMany({
      where:
        scope === "admin_unscoped"
          ? undefined
          : { organisationId: { in: scope } },
      take: 100,
    });
    return jsonOk({ vehicles });
  } catch (e) {
    if (e instanceof BreakGlassRequiredError) {
      return jsonError(e.message, e.status);
    }
    if (e instanceof OrganisationAccessError) {
      return jsonError(e.message === "FORBIDDEN" ? "Forbidden" : e.message, 403);
    }
    throw e;
  }
}

export async function POST(req: Request) {
  const user = await requireApiPermission("vehicle:manage:org");
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const parsed = createVehicleBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await assertOrganisationAccess(
      user,
      parsed.data.organisationId,
      "vehicle:manage:org",
    );
    const vehicle = await createVehicle({
      organisationId: parsed.data.organisationId,
      displayName: parsed.data.displayName,
      vehicleType: parsed.data.vehicleType,
      registrationNumber: parsed.data.registrationNumber,
      wheelchairAccessible: parsed.data.wheelchairAccessible,
      rampAvailable: parsed.data.rampAvailable,
      liftAvailable: parsed.data.liftAvailable,
      actorUserId: user.id,
    });
    return jsonOk({ vehicle }, 201);
  } catch (e) {
    if (e instanceof BreakGlassRequiredError) {
      return jsonError(e.message, e.status);
    }
    if (e instanceof OrganisationAccessError) {
      return jsonError("Forbidden", 403);
    }
    throw e;
  }
}
