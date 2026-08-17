import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { runCareWorkerMatch } from "@/lib/matching/matching-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ careRequestId: string }> }
) {
  const user = await requireApiPermission("matching:run");
  if (user instanceof Response) return user;
  const { careRequestId } = await params;
  const result = await runCareWorkerMatch(careRequestId, user.id);
  return jsonOk(result, 201);
}
