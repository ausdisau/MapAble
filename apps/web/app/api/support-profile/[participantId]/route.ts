import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getSupportProfileForViewer } from "@/lib/support/profile/support-profile-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { participantId } = await params;

  if (user.primaryRole !== "support_coordinator" && user.primaryRole !== "mapable_admin") {
    return jsonError("Forbidden", 403);
  }

  try {
    const profile = await getSupportProfileForViewer({
      participantId,
      viewer: user,
    });
    return jsonOk({ profile });
  } catch (e) {
    if (e instanceof Error && e.message === "CONSENT_REQUIRED") {
      return jsonError("Consent required to view support profile", 403);
    }
    if (e instanceof Error && e.message === "SUPPORT_PROFILE_DISABLED") {
      return jsonError("Support profile is not enabled", 503);
    }
    return jsonError("Could not load support profile", 500);
  }
}
