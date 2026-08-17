import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  createJobApplication,
  sanitizeApplicationForViewer,
} from "@/lib/jobs/job-service";
import { prisma } from "@/lib/prisma";
import { createJobApplicationSchema } from "@/lib/validation/jobs";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const apps = await prisma.jobApplication.findMany({
    where: isAdminRole(user.primaryRole)
      ? {}
      : { participantId: user.id },
    include: { job: { select: { title: true } } },
    take: 100,
  });

  const sanitized = apps.map((a) =>
    sanitizeApplicationForViewer(a, {
      isParticipant: a.participantId === user.id,
      isEmployerWithConsent: false,
      isAdmin: isAdminRole(user.primaryRole),
    })
  );
  return jsonOk({ applications: sanitized });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("jobs:apply");
  if (user instanceof Response) return user;
  try {
    const parsed = createJobApplicationSchema.parse(await req.json());
    const app = await createJobApplication({
      ...parsed,
      participantId: user.id,
    });
    return jsonOk({ application: app }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (
      e instanceof Error &&
      e.message === "ADJUSTMENT_CONFIRMATION_REQUIRED"
    ) {
      return jsonError(
        "Confirm sharing before submitting reasonable adjustment details",
        403
      );
    }
    return jsonError("Create failed", 500);
  }
}
