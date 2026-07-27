import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { supportCoordinationConfig } from "@/lib/config/support-coordination";
import {
  createCase,
  listCaseload,
} from "@/lib/support-coordination/coordination-case-service";

const createSchema = z.object({
  participantId: z.string().min(1),
  title: z.string().min(1).max(200),
  organisationId: z.string().optional(),
  operationalPriority: z
    .enum(["low", "medium", "high", "urgent"])
    .optional(),
  linkedCaseId: z.string().optional(),
  linkedMissionId: z.string().optional(),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (
    !supportCoordinationConfig.enabled ||
    !hasPermission(user.primaryRole, "coordinator:portal")
  ) {
    return jsonOk({ cases: [] });
  }

  try {
    return jsonOk({ cases: await listCaseload(user.id) });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "SUPPORT_COORDINATION_DISABLED"
    ) {
      return jsonOk({ cases: [] });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!supportCoordinationConfig.enabled) {
    return jsonError("Support coordination is disabled", 404);
  }
  if (!hasPermission(user.primaryRole, "coordinator:portal")) {
    return jsonError("Forbidden", 403);
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const coordinationCase = await createCase(
      {
        participantId: parsed.data.participantId,
        coordinatorId: user.id,
        title: parsed.data.title,
        organisationId: parsed.data.organisationId,
        operationalPriority: parsed.data.operationalPriority,
        linkedCaseId: parsed.data.linkedCaseId,
        linkedMissionId: parsed.data.linkedMissionId,
      },
      user.id,
    );
    return jsonOk({ case: coordinationCase }, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "COORDINATOR_AUTHORITY_REQUIRED") {
        return jsonError("Coordinator authority required", 403);
      }
    }
    throw error;
  }
}
