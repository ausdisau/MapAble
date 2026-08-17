import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getAcademyCatalog } from "@/lib/provider/academy/academy-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ catalog: await getAcademyCatalog() });
}
