import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { OrganisationAccessError, assertOrganisationAccess, workersListWhere } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { createWorkerProfile } from "@/lib/workers/worker-profile-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const where = await workersListWhere(user);
  const workers = await prisma.workerProfile.findMany({
    where,
    take: 100,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      displayName: true,
      profileSummary: true,
      verificationStatus: true,
      active: true,
      organisationId: true,
      userId: true,
    },
  });
  return jsonOk({ workers });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("worker:manage:org");
  if (user instanceof Response) return user;

  const body = await req.json();
  if (!body.organisationId || !body.userId || !body.displayName) {
    return jsonError("organisationId, userId, displayName required", 400);
  }

  try {
    await assertOrganisationAccess(user, body.organisationId);
    const profile = await createWorkerProfile({
      organisationId: body.organisationId,
      userId: body.userId,
      displayName: body.displayName,
      profileSummary: body.profileSummary,
      serviceTypes: body.serviceTypes,
      serviceRegions: body.serviceRegions,
      languages: body.languages,
      createdById: user.id,
    });
    return jsonOk({ profile }, 201);
  } catch (e) {
    if (e instanceof OrganisationAccessError) return jsonError("Forbidden", 403);
    throw e;
  }
}
