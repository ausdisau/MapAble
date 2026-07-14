import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { canProviderAccessOrg } from "@/lib/engagement/engagement-access";
import { qualityAccreditationConfig } from "@/lib/config/quality-accreditation";
import {
  acknowledgePolicy,
  listPolicyDocuments,
  listTrainingRequirements,
  publishPolicyDocument,
  recordTrainingCompletion,
} from "@/lib/quality/policies/policy-service";

const policySchema = z.object({
  organisationId: z.string(),
  title: z.string().min(1),
  version: z.string().min(1),
  storagePath: z.string().optional(),
  contentSummary: z.string().optional(),
});

const ackSchema = z.object({
  policyDocumentId: z.string(),
  versionAcknowledged: z.string(),
});

const completionSchema = z.object({
  requirementId: z.string(),
  evidenceRef: z.string().optional(),
  notes: z.string().optional(),
  renewalDays: z.number().int().positive().optional(),
});

export async function GET(req: Request) {
  if (!qualityAccreditationConfig.qmsEnabled) {
    return jsonError("Quality QMS is not enabled", 503);
  }

  const user = await requireApiPermission("engagement:provider:read");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId");
  if (!organisationId) return jsonError("organisationId is required", 400);

  const allowed = await canProviderAccessOrg(user.id, organisationId);
  if (!allowed) return jsonError("Not authorised", 403);

  const view = url.searchParams.get("view");
  if (view === "training") {
    return jsonOk({
      requirements: await listTrainingRequirements(organisationId),
    });
  }

  return jsonOk({ policies: await listPolicyDocuments(organisationId) });
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
    if (action === "publish_policy") {
      const parsed = policySchema.safeParse(body);
      if (!parsed.success) return zodErrorResponse(parsed.error);
      const allowed = await canProviderAccessOrg(
        user.id,
        parsed.data.organisationId,
      );
      if (!allowed) return jsonError("Not authorised", 403);
      const policy = await publishPolicyDocument(parsed.data);
      return jsonOk({ policy }, 201);
    }

    if (action === "acknowledge_policy") {
      const parsed = ackSchema.safeParse(body);
      if (!parsed.success) return zodErrorResponse(parsed.error);
      const ack = await acknowledgePolicy({
        ...parsed.data,
        userId: user.id,
      });
      return jsonOk({ acknowledgement: ack }, 201);
    }

    if (action === "record_training_completion") {
      const parsed = completionSchema.safeParse(body);
      if (!parsed.success) return zodErrorResponse(parsed.error);
      const record = await recordTrainingCompletion({
        ...parsed.data,
        userId: user.id,
      });
      return jsonOk({ record }, 201);
    }

    return jsonError("Unknown action", 400);
  } catch (e) {
    if (e instanceof Error && e.message === "QUALITY_QMS_DISABLED") {
      return jsonError("Quality QMS is not enabled", 503);
    }
    return jsonError("Request failed", 500);
  }
}
