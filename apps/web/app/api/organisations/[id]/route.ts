import { ZodError } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { organisationSchema } from "@/lib/validation/organisation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const org = await prisma.organisation.findUnique({ where: { id } });
  if (!org) return jsonError("Not found", 404);
  return jsonOk({ organisation: org });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    const existing = await prisma.organisation.findUnique({ where: { id } });
    if (!existing) return jsonError("Not found", 404);

    const parsed = organisationSchema.partial().parse(await req.json());
    const org = await prisma.organisation.update({
      where: { id },
      data: parsed,
    });

    if (
      parsed.verificationStatus &&
      parsed.verificationStatus !== existing.verificationStatus
    ) {
      await createAuditEvent({
        actorUserId: user.id,
        actorRole: user.primaryRole as never,
        action: "organisation.verification_changed",
        entityType: "Organisation",
        entityId: org.id,
        organisationId: org.id,
        metadata: {
          from: existing.verificationStatus,
          to: parsed.verificationStatus,
        },
      });
    }

    return jsonOk({ organisation: org });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Update failed", 500);
  }
}
