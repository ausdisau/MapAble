import { randomUUID } from "crypto";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isResponse,
  requireAnyBillingPermission,
} from "@/lib/billing/api-helpers";
import { calculateSupportSavings } from "@/lib/billing/replacement-calculator";
import {
  buildReplacementSupportEvidencePack,
  ReplacementSupportRequestSchema,
  type ReplacementSupportAuditLogPayload,
} from "@/lib/billing/replacement-support";

export async function POST(req: Request) {
  const user = await requireAnyBillingPermission([
    "billing:create_draft",
    "billing:export",
  ]);
  if (isResponse(user)) return user;

  const body = await req.json().catch(() => ({}));
  const parsed = ReplacementSupportRequestSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const request = parsed.data;
    const calculations = calculateSupportSavings({
      replacedSupportHoursPerWeek: request.replacedSupportHoursPerWeek,
      hourlyWorkerRateAUD: request.hourlyWorkerRateAUD,
      unitCostAUD: request.proposedDevice.unitCostAUD,
    });
    const evidencePack = buildReplacementSupportEvidencePack({
      request,
      calculations,
    });

    const evidencePackId = randomUUID();
    const generatedAt = new Date().toISOString();

    const auditLogPayload: ReplacementSupportAuditLogPayload = {
      action: "replacement_support_evidence_generated",
      actorUserId: user.id,
      evidencePackId,
      participantId: request.participantId,
      summary: evidencePack.summary,
      createdAt: generatedAt,
    };

    return jsonOk(
      {
        evidencePackId,
        generatedAt,
        request,
        calculations,
        evidencePack,
        auditLogPayload,
      },
      201
    );
  } catch (e) {
    return jsonError(
      e instanceof Error
        ? e.message
        : "Failed to generate replacement support evidence pack",
      400
    );
  }
}
