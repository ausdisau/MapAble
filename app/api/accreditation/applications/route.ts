import { z } from "zod";

import {
  addApplicationEvidence,
  createApplication,
  getApplicationDetail,
  listApplicationsForOrganisation,
  listApplicationsForReview,
  prepareAssessmentEvidenceIndex,
  recordHumanDecision,
  requestClarification,
  respondToClarification,
  submitApplication,
  submitAppeal,
} from "@/lib/accreditation/provider-accreditation-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { qualityAccreditationConfig } from "@/lib/config/quality-accreditation";
import { canProviderAccessOrg } from "@/lib/engagement/engagement-access";

const createSchema = z.object({
  organisationId: z.string(),
  frameworkId: z.string(),
  accessAccreditationAssessmentId: z.string().optional(),
});

const evidenceSchema = z.object({
  applicationId: z.string(),
  requirementId: z.string().optional(),
  storagePath: z.string().optional(),
  caption: z.string().optional(),
  sourceRef: z.string().optional(),
});

const decisionSchema = z.object({
  applicationId: z.string(),
  outcome: z.enum([
    "approved",
    "conditionally_approved",
    "rejected",
    "suspended",
  ]),
  conditions: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  if (!qualityAccreditationConfig.providerAccreditationEnabled) {
    return jsonError("Provider accreditation is not enabled", 503);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const applicationId = url.searchParams.get("applicationId");

  if (applicationId) {
    if (!isAdminRole(user.primaryRole)) {
      return jsonError("Not authorised", 403);
    }
    const application = await getApplicationDetail(applicationId);
    if (!application) return jsonError("Not found", 404);
    return jsonOk({ application });
  }

  if (isAdminRole(user.primaryRole)) {
    return jsonOk({ applications: await listApplicationsForReview() });
  }

  const organisationId = url.searchParams.get("organisationId");
  if (!organisationId) return jsonError("organisationId is required", 400);

  const allowed = await canProviderAccessOrg(user.id, organisationId);
  if (!allowed) return jsonError("Not authorised", 403);

  return jsonOk({
    applications: await listApplicationsForOrganisation(organisationId),
  });
}

export async function POST(req: Request) {
  if (!qualityAccreditationConfig.providerAccreditationEnabled) {
    return jsonError("Provider accreditation is not enabled", 503);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const action = body.action as string;

  try {
    if (action === "create") {
      const parsed = createSchema.safeParse(body);
      if (!parsed.success) return zodErrorResponse(parsed.error);
      const allowed = await canProviderAccessOrg(
        user.id,
        parsed.data.organisationId,
      );
      if (!allowed) return jsonError("Not authorised", 403);
      const application = await createApplication({
        ...parsed.data,
        submittedById: user.id,
      });
      return jsonOk({ application }, 201);
    }

    if (action === "submit") {
      const application = await submitApplication(body.applicationId, user.id);
      return jsonOk({ application });
    }

    if (action === "add_evidence") {
      const parsed = evidenceSchema.safeParse(body);
      if (!parsed.success) return zodErrorResponse(parsed.error);
      const evidence = await addApplicationEvidence({
        ...parsed.data,
        actorId: user.id,
      });
      return jsonOk({ evidence }, 201);
    }

    if (action === "prepare_evidence_index") {
      if (!isAdminRole(user.primaryRole)) {
        return jsonError("Assessor access required", 403);
      }
      const assessment = await prepareAssessmentEvidenceIndex({
        applicationId: body.applicationId,
        assessorId: user.id,
        notes: body.notes,
      });
      return jsonOk({ assessment }, 201);
    }

    if (action === "request_clarification") {
      if (!isAdminRole(user.primaryRole)) {
        return jsonError("Assessor access required", 403);
      }
      const clarification = await requestClarification({
        applicationId: body.applicationId,
        requestedById: user.id,
        question: body.question,
      });
      return jsonOk({ clarification }, 201);
    }

    if (action === "respond_clarification") {
      const clarification = await respondToClarification({
        clarificationId: body.clarificationId,
        response: body.response,
        actorId: user.id,
      });
      return jsonOk({ clarification });
    }

    if (action === "record_decision") {
      if (!isAdminRole(user.primaryRole)) {
        return jsonError("Human assessor access required", 403);
      }
      const parsed = decisionSchema.safeParse(body);
      if (!parsed.success) return zodErrorResponse(parsed.error);
      const decision = await recordHumanDecision({
        applicationId: parsed.data.applicationId,
        deciderId: user.id,
        outcome: parsed.data.outcome,
        conditions: parsed.data.conditions,
        expiresAt: parsed.data.expiresAt
          ? new Date(parsed.data.expiresAt)
          : undefined,
        notes: parsed.data.notes,
      });
      return jsonOk({ decision }, 201);
    }

    if (action === "submit_appeal") {
      const appeal = await submitAppeal({
        applicationId: body.applicationId,
        appellantId: user.id,
        reason: body.reason,
      });
      return jsonOk({ appeal }, 201);
    }

    return jsonError("Unknown action", 400);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "PROVIDER_ACCREDITATION_DISABLED") {
        return jsonError("Provider accreditation is not enabled", 503);
      }
      if (e.message === "PROHIBITED_AUTOMATIC_ACCREDITATION_DECISION") {
        return jsonError("Automatic accreditation decisions are prohibited", 403);
      }
    }
    return jsonError("Request failed", 500);
  }
}
