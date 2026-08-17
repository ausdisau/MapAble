import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getServiceLogForUser } from "@/lib/care/care-service-log-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const log = await getServiceLogForUser(id, user);
    return jsonOk({ log });
  } catch {
    return jsonError("Not found", 404);
  }
}
