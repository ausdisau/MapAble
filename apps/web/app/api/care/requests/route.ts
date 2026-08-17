import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { participantCareWhere, providerCareWhere } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { createCareRequest } from "@/lib/care/care-request-service";
import { prisma } from "@/lib/prisma";
import { createCareRequestSchema } from "@/lib/validation/care";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const where = isAdminRole(user.primaryRole)
    ? {}
    : user.primaryRole === "provider_admin" ||
        user.primaryRole === "support_worker"
      ? await providerCareWhere(user)
      : participantCareWhere(user);

  const requests = await prisma.careRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return jsonOk({ requests });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;

  try {
    const parsed = createCareRequestSchema.parse(await req.json());
    const request = await createCareRequest({
      ...parsed,
      preferredDate: parsed.preferredDate
        ? new Date(parsed.preferredDate)
        : undefined,
      participantId: user.id,
      createdById: user.id,
    });
    return jsonOk({ request }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "CONSENT_REQUIRED") {
      return jsonError(
        "Consent is required before sharing accessibility details",
        403
      );
    }
    return jsonError("Create failed", 500);
  }
}
