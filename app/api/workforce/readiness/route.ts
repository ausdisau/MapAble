import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { assertOrganisationAccess, OrganisationAccessError } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { getCommunicationPassport } from "@/lib/support/communication-passport/service";
import { isWorkforceReadinessEnabled } from "@/lib/config/communication-workforce";
import { prisma } from "@/lib/prisma";
import {
  evaluateAssignmentReadiness,
  WorkforceReadinessError,
} from "@/lib/workforce/readiness/evaluate";

const bodySchema = z
  .object({
    workerProfileId: z.string().min(1),
    participantId: z.string().min(1),
    organisationId: z.string().min(1),
    academyModuleCompletions: z.array(z.string()).max(50).optional(),
    authorisedCompetencyEvidenceIds: z.array(z.string()).max(50).optional(),
    requiresAacFamiliarity: z.boolean().optional(),
  })
  .strict();

/**
 * Evaluate readiness reasons only. Does not assign workers.
 */
export async function POST(req: Request) {
  if (!isWorkforceReadinessEnabled()) {
    return jsonError("Workforce readiness is not enabled", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  try {
    const parsed = bodySchema.parse(body);
    await assertOrganisationAccess(user, parsed.organisationId, "care:manage:org");

    const worker = await prisma.workerProfile.findUnique({
      where: { id: parsed.workerProfileId },
      select: {
        id: true,
        userId: true,
        organisationId: true,
        active: true,
        workerScreeningStatus: true,
        wwccStatus: true,
        firstAidStatus: true,
        insuranceStatus: true,
        verificationStatus: true,
      },
    });

    const passport = await getCommunicationPassport(parsed.participantId);
    const result = await evaluateAssignmentReadiness({
      worker,
      organisationId: parsed.organisationId,
      passport,
      academyModuleCompletions: parsed.academyModuleCompletions,
      authorisedCompetencyEvidenceIds: parsed.authorisedCompetencyEvidenceIds,
      requiresAacFamiliarity: parsed.requiresAacFamiliarity,
    });

    return jsonOk({
      result,
      notice:
        "Ready means deterministic checks passed. Humans must assign. Auto-assignment is permanently disabled.",
    });
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    if (err instanceof OrganisationAccessError) {
      return jsonError("Organisation access denied", 403);
    }
    if (err instanceof WorkforceReadinessError) {
      return jsonError(err.message, err.status);
    }
    throw err;
  }
}
