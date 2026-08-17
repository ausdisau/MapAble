import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { apiForbidden } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { isFoundationalSupportsEnabled } from "@/lib/config/strategic-2026";
import {
  foundationalSupportsToGeoJson,
  listFoundationalSupportsNear,
} from "@/lib/navigator/foundational-supports-store";
import { FOUNDATIONAL_SUPPORT_CATEGORIES } from "@/lib/schemas/foundational-supports";

const QuerySchema = z.object({
  latitude: z.coerce.number().finite().gte(-90).lte(90),
  longitude: z.coerce.number().finite().gte(-180).lte(180),
  radiusKm: z.coerce.number().finite().positive().max(200).optional(),
  category: z.enum(FOUNDATIONAL_SUPPORT_CATEGORIES).optional(),
});

export async function GET(req: Request) {
  if (!isFoundationalSupportsEnabled()) {
    return jsonError("Foundational supports overlay is disabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const allowed =
    hasPermission(user.primaryRole, "booking:create") ||
    hasPermission(user.primaryRole, "provider:booking:respond") ||
    user.primaryRole === "support_coordinator" ||
    isAdminRole(user.primaryRole);
  if (!allowed) return apiForbidden();

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    latitude: url.searchParams.get("latitude"),
    longitude: url.searchParams.get("longitude"),
    radiusKm: url.searchParams.get("radiusKm") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
  });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const items = listFoundationalSupportsNear(parsed.data);
  return jsonOk({
    ...foundationalSupportsToGeoJson(items),
    count: items.length,
    notice:
      "Foundational supports are non-NDIS community/state fixtures (scaffold).",
  });
}
