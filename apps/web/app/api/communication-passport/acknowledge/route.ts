import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  getUserOrganisationIds,
  OrganisationAccessError,
} from "@/lib/api/organisation-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { isCommunicationPassportEnabled } from "@/lib/config/communication-workforce";
import { checkConsent } from "@/lib/consent/consent-service";
import { assertAdminTenantAccess } from "@/lib/security/break-glass";
import {
  acknowledgeCommunicationPassport,
  CommunicationPassportError,
  getWorkerFacingPassport,
} from "@/lib/support/communication-passport/service";

const acknowledgeSchema = z
  .object({
    participantId: z.string().min(1),
    passportVersion: z.number().int().positive(),
    organisationId: z.string().min(1),
    purpose: z.string().min(3).max(500),
  })
  .strict();

export async function POST(req: Request) {
  if (!isCommunicationPassportEnabled()) {
    return jsonError("Communication Passport is not enabled", 503);
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
    const parsed = acknowledgeSchema.parse(body);
    if (isAdminRole(user.primaryRole)) {
      assertAdminTenantAccess(user, parsed.organisationId);
    } else {
      const orgIds = await getUserOrganisationIds(user.id);
      if (!orgIds.includes(parsed.organisationId)) {
        throw new OrganisationAccessError();
      }
    }

    const consented = await checkConsent({
      subjectUserId: parsed.participantId,
      scope: "support_profile.read",
      grantedToUserId: user.id,
      grantedToOrganisationId: parsed.organisationId,
    });
    if (!consented) {
      return jsonError("Purpose-bound consent required for passport disclosure", 403);
    }

    const workerView = await getWorkerFacingPassport({
      participantId: parsed.participantId,
      workerUserId: user.id,
      purpose: parsed.purpose,
    });

    const acknowledgement = await acknowledgeCommunicationPassport({
      workerUserId: user.id,
      participantId: parsed.participantId,
      passportVersion: parsed.passportVersion,
      organisationId: parsed.organisationId,
    });

    return jsonOk({ acknowledgement, passport: workerView }, 201);
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    if (err instanceof OrganisationAccessError) {
      return jsonError("Organisation access denied", 403);
    }
    if (err instanceof CommunicationPassportError) {
      return jsonError(err.message, err.status);
    }
    throw err;
  }
}
