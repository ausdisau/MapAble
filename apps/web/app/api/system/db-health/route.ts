import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { postgresAdapter } from "@/lib/integrations/adapters/postgres-adapter";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const health = await postgresAdapter.healthCheck();
  return jsonOk({
    service: "database",
    ...health,
    timestamp: new Date().toISOString(),
  });
}
