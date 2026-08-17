import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { searchCasesForUser } from "@/lib/cases/case-service";
import { caseManagementConfig } from "@/lib/config/case-management";

const Schema = z.object({ query: z.string().min(2).max(500) });

export async function POST(req: Request) {
  if (!caseManagementConfig.enabled)
    return jsonError("Case management is disabled", 404);
  if (!caseManagementConfig.aiEnabled)
    return jsonError("Case AI is disabled", 503);

  const user = await requireApiPermission("case:ai:run");
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const hits = await searchCasesForUser(
    user.id,
    user.primaryRole,
    parsed.data.query,
  );
  return jsonOk({ hits });
}
