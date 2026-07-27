import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  generateMatchExplanation,
  getMatchExplanation,
} from "@/lib/jobs/matching/match-explanation-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { jobId } = await params;
  try {
    const match = await getMatchExplanation(jobId, user.id);
    if (!match) return jsonError("Match explanation not found", 404);
    return jsonOk({ match });
  } catch (e) {
    if (e instanceof Error && e.message === "JOBS_PARTICIPATION_DISABLED") {
      return jsonError("Jobs participation is unavailable", 503);
    }
    return jsonError("Failed to load match", 500);
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { jobId } = await params;
  try {
    return jsonOk({
      match: await generateMatchExplanation(jobId, user.id, user.id),
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "JOBS_PARTICIPATION_DISABLED") {
        return jsonError("Jobs participation is unavailable", 503);
      }
      if (e.message === "JOBS_MATCHING_EXPLANATIONS_DISABLED") {
        return jsonError("Matching explanations are unavailable", 503);
      }
      if (e.message === "JOB_NOT_FOUND") return jsonError("Job not found", 404);
    }
    return jsonError("Failed to generate match explanation", 500);
  }
}
