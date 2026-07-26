import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listTrustSafetyQueue,
  syncTrustSafetyQueue,
} from "@/lib/trust/safety/queue-service";
import { adminListQuerySchema } from "@/server/admin/adminSchemas";

export async function GET(req: Request) {
  const user = await requireApiAdminScope("admin:safeguarding:read");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const query = adminListQuerySchema.parse({
    q: url.searchParams.get("q") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
  });

  if (url.searchParams.get("sync") === "true") {
    const items = await syncTrustSafetyQueue();
    return jsonOk({ items: items.slice(query.offset, query.offset + query.limit), total: items.length });
  }

  const items = await listTrustSafetyQueue();
  return jsonOk({
    items: items.slice(query.offset, query.offset + query.limit),
    total: items.length,
  });
}
