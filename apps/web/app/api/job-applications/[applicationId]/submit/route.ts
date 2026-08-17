import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { submitJobApplication } from "@/lib/jobs/job-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const user = await requireApiPermission("jobs:apply");
  if (user instanceof Response) return user;
  const { applicationId } = await params;

  const existing = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
  });
  if (!existing || existing.participantId !== user.id) {
    return jsonError("Not found", 404);
  }

  const application = await submitJobApplication(applicationId, user.id);
  return jsonOk({ application });
}
