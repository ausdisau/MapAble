import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { sanitizeApplicationForViewer } from "@/lib/jobs/job-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { applicationId } = await params;

  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });
  if (!app) return jsonError("Not found", 404);

  const sanitized = sanitizeApplicationForViewer(app, {
    isParticipant: app.participantId === user.id,
    isEmployerWithConsent:
      app.shareAdjustments && user.primaryRole === "employer",
    isAdmin: isAdminRole(user.primaryRole),
  });
  return jsonOk({ application: sanitized });
}
