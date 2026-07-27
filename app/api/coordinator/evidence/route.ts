import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { supportCoordinationConfig } from "@/lib/config/support-coordination";
import {
  addClaimWithProvenance,
  buildPack,
  createEvidenceRequest,
  listEvidenceRequestsForCoordinator,
} from "@/lib/support-coordination/evidence-pack-service";

const createSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create_request"),
    caseId: z.string().min(1),
    participantId: z.string().min(1),
    purpose: z.enum([
      "plan_review",
      "change_of_circumstances",
      "home_living",
      "assistive_technology",
      "service_continuity",
      "participant_outcomes",
    ]),
    dueAt: z.string().datetime().optional(),
  }),
  z.object({
    action: z.literal("add_claim"),
    requestId: z.string().min(1),
    statement: z.string().min(1).max(5000),
    sourceRef: z.string().min(1).max(500),
  }),
  z.object({
    action: z.literal("build_pack"),
    caseId: z.string().min(1),
    packType: z.string().min(1).max(120),
    requestIds: z.array(z.string()).optional(),
  }),
]);

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (
    !supportCoordinationConfig.enabled ||
    !supportCoordinationConfig.evidencePacksEnabled ||
    !hasPermission(user.primaryRole, "coordinator:portal")
  ) {
    return jsonOk({ requests: [] });
  }

  return jsonOk({
    requests: await listEvidenceRequestsForCoordinator(user.id),
  });
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!supportCoordinationConfig.enabled) {
    return jsonError("Support coordination is disabled", 404);
  }
  if (!supportCoordinationConfig.evidencePacksEnabled) {
    return jsonError("Evidence packs are disabled", 404);
  }
  if (!hasPermission(user.primaryRole, "coordinator:portal")) {
    return jsonError("Forbidden", 403);
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    switch (parsed.data.action) {
      case "create_request":
        return jsonOk(
          {
            request: await createEvidenceRequest(
              {
                caseId: parsed.data.caseId,
                participantId: parsed.data.participantId,
                purpose: parsed.data.purpose,
                dueAt: parsed.data.dueAt
                  ? new Date(parsed.data.dueAt)
                  : null,
              },
              user.id,
            ),
          },
          201,
        );
      case "add_claim":
        return jsonOk({
          request: await addClaimWithProvenance({
            requestId: parsed.data.requestId,
            claim: {
              statement: parsed.data.statement,
              sourceRef: parsed.data.sourceRef,
            },
            actorUserId: user.id,
          }),
        });
      case "build_pack":
        return jsonOk(
          {
            pack: await buildPack({
              caseId: parsed.data.caseId,
              packType: parsed.data.packType,
              requestIds: parsed.data.requestIds,
              actorUserId: user.id,
            }),
          },
          201,
        );
      default: {
        const _exhaustive: never = parsed.data;
        return jsonError(`Unknown action: ${String(_exhaustive)}`, 400);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "COORDINATOR_AUTHORITY_REQUIRED") {
        return jsonError("Coordinator authority required", 403);
      }
      if (error.message === "EVIDENCE_SOURCE_REF_REQUIRED") {
        return jsonError("Every claim requires a source reference", 400);
      }
    }
    throw error;
  }
}
