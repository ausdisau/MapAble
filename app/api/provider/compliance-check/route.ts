import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { apiForbidden } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { isPlatformShieldEnabled } from "@/lib/compliance/platform-shield-config";
import { evaluateProviderComplianceShield } from "@/lib/compliance/platform-shield";

const BodySchema = z.object({
  workerId: z.string().min(1),
  providerId: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  if (!isPlatformShieldEnabled()) {
    return jsonError("Platform Registration Shield is disabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const allowed =
    hasPermission(user.primaryRole, "worker:manage:org") ||
    hasPermission(user.primaryRole, "provider:booking:respond") ||
    hasPermission(user.primaryRole, "admin:billing:read");
  if (!allowed) return apiForbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await evaluateProviderComplianceShield(parsed.data.workerId);

    await createAuditEvent({
      actorUserId: user.id,
      action: "compliance.platform_shield.evaluated",
      entityType: "WorkerProfile",
      entityId: parsed.data.workerId,
      organisationId: parsed.data.providerId,
      metadata: {
        deficitsHash: result.deficitsHash,
        activeShieldTier: result.activeShieldTier,
        dispatchEligible: result.dispatchEligible,
        blockingCount: result.blockingDeficits.length,
      },
    });

    return jsonOk({
      ...result,
      workerId: parsed.data.workerId,
      providerId: parsed.data.providerId ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Compliance check failed";
    if (message === "WORKER_NOT_FOUND") return jsonError(message, 404);
    if (message === "PLATFORM_SHIELD_DISABLED") {
      return jsonError("Platform Registration Shield is disabled", 404);
    }
    return jsonError(message, 400);
  }
}
