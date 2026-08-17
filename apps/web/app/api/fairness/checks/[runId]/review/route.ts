import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { recordFairnessReview } from "@/lib/fairness/fairness-check-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const user = await requireApiPermission("fairness:review");
  if (user instanceof Response) return user;
  const { runId } = await params;
  const body = await req.json();
  const check = await recordFairnessReview(
    runId,
    user.id,
    body.decision ?? "approved",
    body.notes
  );
  return jsonOk({ check });
}
