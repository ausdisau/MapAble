import { runAiCareMatch } from "@/lib/ai/matching/ai-match-service";
import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ careRequestId: string }> }
) {
  const user = await requireApiPermission("ai_matching:run");
  if (user instanceof Response) return user;
  const { careRequestId } = await params;
  const result = await runAiCareMatch(careRequestId, user.id);
  return jsonOk(result);
}
