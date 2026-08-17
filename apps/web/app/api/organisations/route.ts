import { ZodError } from "zod";

import { requireApiAdmin, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { organisationSchema } from "@/lib/validation/organisation";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  const organisations = await prisma.organisation.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { contactEmail: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    take: 100,
  });

  return jsonOk({ organisations });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  try {
    const parsed = organisationSchema.parse(await req.json());
    const org = await prisma.organisation.create({ data: parsed });

    await createAuditEvent({
      actorUserId: user.id,
      actorRole: user.primaryRole as never,
      action: "organisation.created",
      entityType: "Organisation",
      entityId: org.id,
      organisationId: org.id,
    });

    return jsonOk({ organisation: org }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Create failed", 500);
  }
}
