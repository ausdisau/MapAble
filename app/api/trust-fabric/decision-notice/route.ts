import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { isTrustFabricEnabled } from "@/lib/config/trust-fabric";
import { createDecisionNotice } from "@/lib/trust-fabric/decision-notice";
import { TrustFabricError } from "@/lib/trust-fabric/receipt-service";

const noticeSchema = z
  .object({
    decision: z.string().min(3).max(500),
    responsibleSystem: z.string().min(2).max(200),
    reasonCodes: z.array(z.string().min(1).max(100)).min(1).max(20),
    evidenceRefs: z.array(z.string().min(1).max(200)).max(50).optional(),
    unknowns: z.array(z.string().min(1).max(200)).max(50).optional(),
    participantId: z.string().min(1).optional(),
    organisationId: z.string().min(1).optional(),
    reviewPath: z.string().min(1).max(500),
    correctionPath: z.string().min(1).max(500),
    correlationId: z.string().min(1).max(100).optional(),
  })
  .strict();

/** Internal/admin writer for consequential deterministic decision notices. */
export async function POST(req: Request) {
  if (!isTrustFabricEnabled()) {
    return jsonError("Trust Fabric is not enabled", 503);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isAdminRole(user.primaryRole) && user.primaryRole !== "provider_admin") {
    return jsonError("Forbidden", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  try {
    const parsed = noticeSchema.parse(body);
    const notice = await createDecisionNotice({
      ...parsed,
      humanOwnerUserId: user.id,
    });
    return jsonOk({ notice }, 201);
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    if (err instanceof TrustFabricError) {
      return jsonError(err.message, err.status);
    }
    throw err;
  }
}
