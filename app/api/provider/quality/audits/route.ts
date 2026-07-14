import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { canProviderAccessOrg } from "@/lib/engagement/engagement-access";
import { qualityAccreditationConfig } from "@/lib/config/quality-accreditation";
import {
  createAuditPlan,
  createAuditFinding,
  createCorrectiveAction,
  listAuditPlans,
} from "@/lib/quality/audits/audit-service";

const planSchema = z.object({
  organisationId: z.string(),
  title: z.string().min(1),
  scope: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

const findingSchema = z.object({
  auditPlanId: z.string(),
  organisationId: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(["minor", "major", "critical"]).optional(),
  indicatorId: z.string().optional(),
});

const correctiveSchema = z.object({
  findingId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export async function GET(req: Request) {
  if (!qualityAccreditationConfig.qmsEnabled) {
    return jsonError("Quality QMS is not enabled", 503);
  }

  const user = await requireApiPermission("engagement:provider:read");
  if (user instanceof Response) return user;

  const organisationId = new URL(req.url).searchParams.get("organisationId");
  if (!organisationId) return jsonError("organisationId is required", 400);

  const allowed = await canProviderAccessOrg(user.id, organisationId);
  if (!allowed) return jsonError("Not authorised", 403);

  return jsonOk({ plans: await listAuditPlans(organisationId) });
}

export async function POST(req: Request) {
  if (!qualityAccreditationConfig.qmsEnabled) {
    return jsonError("Quality QMS is not enabled", 503);
  }

  const user = await requireApiPermission("engagement:provider:read");
  if (user instanceof Response) return user;

  const body = await req.json();
  const action = body.action as string;

  try {
    if (action === "create_plan") {
      const parsed = planSchema.safeParse(body);
      if (!parsed.success) return zodErrorResponse(parsed.error);
      const allowed = await canProviderAccessOrg(
        user.id,
        parsed.data.organisationId,
      );
      if (!allowed) return jsonError("Not authorised", 403);
      const plan = await createAuditPlan({
        organisationId: parsed.data.organisationId,
        title: parsed.data.title,
        scope: parsed.data.scope,
        scheduledAt: parsed.data.scheduledAt
          ? new Date(parsed.data.scheduledAt)
          : undefined,
        createdById: user.id,
      });
      return jsonOk({ plan }, 201);
    }

    if (action === "create_finding") {
      const parsed = findingSchema.safeParse(body);
      if (!parsed.success) return zodErrorResponse(parsed.error);
      const allowed = await canProviderAccessOrg(
        user.id,
        parsed.data.organisationId,
      );
      if (!allowed) return jsonError("Not authorised", 403);
      const finding = await createAuditFinding({
        ...parsed.data,
        actorId: user.id,
      });
      return jsonOk({ finding }, 201);
    }

    if (action === "create_corrective") {
      const parsed = correctiveSchema.safeParse(body);
      if (!parsed.success) return zodErrorResponse(parsed.error);
      const actionRecord = await createCorrectiveAction({
        findingId: parsed.data.findingId,
        title: parsed.data.title,
        description: parsed.data.description,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
        actorId: user.id,
      });
      return jsonOk({ correctiveAction: actionRecord }, 201);
    }

    return jsonError("Unknown action", 400);
  } catch (e) {
    if (e instanceof Error && e.message === "QUALITY_QMS_DISABLED") {
      return jsonError("Quality QMS is not enabled", 503);
    }
    return jsonError("Request failed", 500);
  }
}
