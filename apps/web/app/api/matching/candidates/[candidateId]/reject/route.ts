import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { rejectMatchCandidate } from "@/lib/matching/matching-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const user = await requireApiPermission("matching:run");
  if (user instanceof Response) return user;
  const { candidateId } = await params;
  const candidate = await rejectMatchCandidate(candidateId, user.id);
  return jsonOk({ candidate });
}
