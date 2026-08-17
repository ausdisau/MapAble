import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { createInterviewSupportDraft } from "@/lib/orchestration/jobs-support-orchestrator";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { applicationId } = await req.json();
  const result = await createInterviewSupportDraft(applicationId, user.id);
  return jsonOk(result);
}
