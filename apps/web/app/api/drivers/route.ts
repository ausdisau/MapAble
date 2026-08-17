import { requireApiPermission } from "@/lib/api/auth-handler";
import {
  OrganisationAccessError,
  assertOrganisationAccess,
  organisationScopedIds,
} from "@/lib/api/organisation-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { BreakGlassRequiredError } from "@/lib/security/break-glass";
import { createDriverProfile } from "@/lib/transport/driver-service";
import { createDriverBodySchema } from "@/lib/validation/org-transport";

export async function GET() {
  const user = await requireApiPermission("driver:manage:org");
  if (user instanceof Response) return user;

  try {
    const scope = await organisationScopedIds(user, "driver:manage:org");
    if (scope !== "admin_unscoped" && scope.length === 0) {
      return jsonOk({ drivers: [] });
    }
    const drivers = await prisma.driverProfile.findMany({
      where:
        scope === "admin_unscoped"
          ? undefined
          : { organisationId: { in: scope } },
      take: 100,
    });
    return jsonOk({ drivers });
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
  const user = await requireApiPermission("driver:manage:org");
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => null);
  const parsed = createDriverBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await assertOrganisationAccess(
      user,
      parsed.data.organisationId,
      "driver:manage:org",
    );
    const driver = await createDriverProfile({
      userId: parsed.data.userId,
      organisationId: parsed.data.organisationId,
      displayName: parsed.data.displayName,
      phone: parsed.data.phone,
      serviceRegions: parsed.data.serviceRegions,
      actorUserId: user.id,
    });
    return jsonOk({ driver }, 201);
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
