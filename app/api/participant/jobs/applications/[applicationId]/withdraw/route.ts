import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { withdrawParticipantApplication } from "@/lib/jobs/applications/participant-application-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { applicationId } = await params;
  try {
    return jsonOk({
      application: await withdrawParticipantApplication(applicationId, user.id),
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "APPLICATION_NOT_FOUND") {
        return jsonError("Application not found", 404);
      }
      if (e.message === "JOBS_PARTICIPATION_DISABLED") {
        return jsonError("Jobs participation is unavailable", 503);
      }
    }
    return jsonError("Failed to withdraw application", 500);
  }
}
