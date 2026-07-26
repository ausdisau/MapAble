import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getNdiaPilotStatus } from "@/lib/ndis/pilot/ndia-pilot-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getNdiaPilotStatus());
}
