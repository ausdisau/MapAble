import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { qualityAccreditationConfig } from "@/lib/config/quality-accreditation";
import { canProviderAccessOrg } from "@/lib/engagement/engagement-access";
import {
  listOrganisationEvidence,
  listPublishedFrameworks,
  submitComplianceEvidence,
} from "@/lib/quality/standards/standards-service";

const evidenceSchema = z.object({
  organisationId: z.string(),
  requirementId: z.string(),
  sourceType: z.enum([
    "self_submitted",
    "audit",
    "third_party",
    "access_mark",
    "incident_record",
    "policy_record",
    "training_record",
    "system_import",
  ]),
  sourceRef: z.string().optional(),
  storagePath: z.string().optional(),
  caption: z.string().optional(),
});

export async function GET(req: Request) {
  if (!qualityAccreditationConfig.qmsEnabled) {
    return jsonError("Quality QMS is not enabled", 503);
  }

  const user = await requireApiPermission("engagement:provider:read");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const view = url.searchParams.get("view");

  if (view === "frameworks") {
    return jsonOk({ frameworks: await listPublishedFrameworks() });
  }

  const organisationId = url.searchParams.get("organisationId");
  if (!organisationId) return jsonError("organisationId is required", 400);

  const allowed = await canProviderAccessOrg(user.id, organisationId);
  if (!allowed) return jsonError("Not authorised", 403);

  return jsonOk({ evidence: await listOrganisationEvidence(organisationId) });
}

export async function POST(req: Request) {
  if (!qualityAccreditationConfig.qmsEnabled) {
    return jsonError("Quality QMS is not enabled", 503);
  }

  const user = await requireApiPermission("engagement:provider:read");
  if (user instanceof Response) return user;

  const parsed = evidenceSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const allowed = await canProviderAccessOrg(user.id, parsed.data.organisationId);
  if (!allowed) return jsonError("Not authorised", 403);

  try {
    const evidence = await submitComplianceEvidence({
      ...parsed.data,
      submittedById: user.id,
    });
    return jsonOk({ evidence }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "QUALITY_QMS_DISABLED") {
      return jsonError("Quality QMS is not enabled", 503);
    }
    return jsonError("Failed to submit evidence", 500);
  }
}
