import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { workerProfileForUser } from "@/lib/care/access-control";
import { createIncident, submitIncident } from "@/lib/incidents/incident-service";
import { prisma } from "@/lib/prisma";
import { createCareIncidentSchema } from "@/lib/validation/care";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const parsed = createCareIncidentSchema.parse(await req.json());
    let organisationId: string | undefined;
    let participantId: string | undefined;
    if (parsed.careShiftId) {
      const shift = await prisma.careShift.findUnique({
        where: { id: parsed.careShiftId },
      });
      if (!shift) return jsonError("Shift not found", 404);
      organisationId = shift.organisationId;
      participantId = shift.participantId;
      if (user.primaryRole === "support_worker") {
        const profile = await workerProfileForUser(user.id);
        if (profile?.id !== shift.workerProfileId) {
          return jsonError("Forbidden", 403);
        }
      }
    }

    const incident = await createIncident({
      category: parsed.category,
      severity: parsed.severity,
      title: parsed.title,
      description: parsed.description,
      reportedById: user.id,
      careShiftId: parsed.careShiftId,
      organisationId,
      participantId,
      immediateRiskPresent: parsed.immediateRiskPresent,
      safeguardingConcern: parsed.safeguardingConcern,
    });

    const submitted = await submitIncident(incident.id, user.id);
    return jsonOk({ incident: submitted }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "INCIDENTS_DISABLED") {
      return jsonError("Incident reporting is disabled", 503);
    }
    return jsonError("Could not create incident", 500);
  }
}
