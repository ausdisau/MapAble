import { getServiceOpsSummary } from "@/lib/admin/service-ops";
import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";

export async function GET() {
  const user = await requireApiPermission("admin:service-ops");
  if (user instanceof Response) return user;
  const summary = await getServiceOpsSummary();
  return jsonOk({ summary });
}
