import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { confirmCareServiceLog } from "@/lib/care/care-service-log-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const log = await confirmCareServiceLog(id, user);
    return jsonOk({ log });
  } catch {
    return jsonError("Could not confirm", 400);
  }
}
