import { requireApiPermission } from "@/lib/api/auth-handler";
import {
  isResponse,
  jsonError,
  jsonOk,
  zodErrorResponse,
} from "@/lib/api/response";
import {
  assertOrgAccess,
  createClaimBatch,
} from "@/lib/ndis/claiming/claim-service";
import { createNdisClaimBatchSchema } from "@/lib/ndis/schemas";

export async function POST(req: Request) {
  const user = await requireApiPermission("provider:ndis:claim");
  if (isResponse(user)) return user;

  const parsed = createNdisClaimBatchSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await assertOrgAccess(user, parsed.data.providerOrgId);
    const result = await createClaimBatch({
      ...parsed.data,
      createdById: user.id,
    });
    if (!result.ok) {
      return jsonOk({ ok: false, validation: result.validation }, 422);
    }
    return jsonOk(result, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    return jsonError(msg, 400);
  }
}
