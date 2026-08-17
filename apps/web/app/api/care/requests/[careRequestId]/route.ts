import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { assertCanViewCareRequest } from "@/lib/care/access-control";
import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ careRequestId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { careRequestId } = await params;

  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    include: {
      assignedOrganisation: { select: { id: true, name: true } },
      shifts: { take: 10 },
    },
  });
  if (!request) return jsonError("Not found", 404);

  try {
    await assertCanViewCareRequest(user, request);
  } catch {
    return jsonError("Forbidden", 403);
  }

  let accessRequirementsSummary = request.accessRequirementsSummary;
  if (
    request.shareAccessibility &&
    request.assignedOrganisationId &&
    request.participantId !== user.id
  ) {
    const hasConsent = await checkConsent({
      subjectUserId: request.participantId,
      scope: "care.accessibility_share",
      grantedToOrganisationId: request.assignedOrganisationId,
    });
    if (!hasConsent) {
      accessRequirementsSummary = null;
    }
  }

  return jsonOk({
    request: { ...request, accessRequirementsSummary },
    accessNotice:
      "Care request details are visible to you, assigned providers, and MapAble admins.",
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ careRequestId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { careRequestId } = await params;
  const body = await req.json();

  const existing = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
  });
  if (!existing) return jsonError("Not found", 404);
  const { isAdminRole } = await import("@/lib/auth/roles");
  if (
    !isAdminRole(user.primaryRole) &&
    existing.participantId !== user.id
  ) {
    return jsonError("Forbidden", 403);
  }

  const request = await prisma.careRequest.update({
    where: { id: careRequestId },
    data: {
      title: body.title,
      description: body.description,
      status: isAdminRole(user.primaryRole) ? body.status : undefined,
    },
  });
  return jsonOk({ request });
}
