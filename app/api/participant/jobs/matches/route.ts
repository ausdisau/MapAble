import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { listMatchExplanations } from "@/lib/jobs/matching/match-explanation-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    return jsonOk({ matches: await listMatchExplanations(user.id) });
  } catch (e) {
    if (e instanceof Error && e.message === "JOBS_PARTICIPATION_DISABLED") {
      return jsonError("Jobs participation is unavailable", 503);
    }
    return jsonError("Failed to load matches", 500);
  }
}
