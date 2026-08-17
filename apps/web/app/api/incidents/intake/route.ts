import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  createFromIntakeWizard,
  submitIncident,
  validateIncidentIntakePath,
} from "@/lib/incidents/incident-service";
import type { IncidentIntakeWizardSteps } from "@/lib/incidents/incident-service";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await requireApiPermission("incident:create");
  if (user instanceof Response) return user;
  const body = (await req.json()) as IncidentIntakeWizardSteps & {
    autoSubmit?: boolean;
  };

  const validationError = validateIncidentIntakePath(body);
  if (validationError) return jsonError(validationError, 400);

  const participantId =
    user.primaryRole === "participant"
      ? user.id
      : body.careShiftId
        ? (
            await prisma.careShift.findUnique({
              where: { id: body.careShiftId },
              select: { participantId: true },
            })
          )?.participantId
        : undefined;

  try {
    const incident = await createFromIntakeWizard({
      ...body,
      reportedById: user.id,
      participantId,
    });

    if (body.autoSubmit) {
      await submitIncident(incident.id, user.id);
    }

    return jsonOk({ incident }, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    return jsonError(message, 400);
  }
}
