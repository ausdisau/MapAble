import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getSupportJourneyGraph } from "@/lib/journey/journey-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const sessions = await getSupportJourneyGraph(user.id);
  return jsonOk({ sessions });
}
