import { ZodError } from "zod";

import { requireApiAdmin, requireApiSession } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { createCareShiftFromRequest } from "@/lib/care/care-shift-service";
import { prisma } from "@/lib/prisma";
import { createCareShiftSchema } from "@/lib/validation/care";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let where: Record<string, unknown> = {};
  if (isAdminRole(user.primaryRole)) {
    where = {};
  } else if (user.primaryRole === "support_worker") {
    where = { workerProfile: { userId: user.id } };
  } else if (user.primaryRole === "provider_admin") {
    const orgIds = await getUserOrganisationIds(user.id);
    where = { organisationId: { in: orgIds } };
  } else {
    where = { participantId: user.id };
  }

  const shifts = await prisma.careShift.findMany({
    where,
    orderBy: { startAt: "desc" },
    take: 100,
  });
  return jsonOk({ shifts });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  try {
    const parsed = createCareShiftSchema.parse(await req.json());
    const shift = await createCareShiftFromRequest({
      careRequestId: parsed.careRequestId,
      organisationId: parsed.organisationId,
      startAt: new Date(parsed.startAt),
      endAt: new Date(parsed.endAt),
      location: parsed.location,
      workerProfileId: parsed.workerProfileId,
      createdById: user.id,
    });
    return jsonOk({ shift }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Create failed", 500);
  }
}
