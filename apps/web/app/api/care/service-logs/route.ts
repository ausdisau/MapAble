import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createCareServiceLogDraft,
  listServiceLogsForUser,
  submitCareServiceLog,
} from "@/lib/care/care-service-log-service";
import { createCareServiceLogSchema } from "@/lib/validation/care";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const logs = await listServiceLogsForUser(user);
  return jsonOk({ logs });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("care:shift:work");
  if (user instanceof Response) return user;
  try {
    const parsed = createCareServiceLogSchema.parse(await req.json());
    let log = await createCareServiceLogDraft({
      careShiftId: parsed.careShiftId,
      actorUser: user,
      supportsDelivered: parsed.supportsDelivered,
      durationMinutes: parsed.durationMinutes,
      notes: parsed.notes,
    });
    if (parsed.supportsDelivered || parsed.notes) {
      const { prisma } = await import("@/lib/prisma");
      log = await prisma.careServiceLog.update({
        where: { id: log.id },
        data: {
          supportsDelivered: (parsed.supportsDelivered ?? []) as object,
          notes: parsed.notes,
          durationMinutes: parsed.durationMinutes,
        },
      });
    }
    log = await submitCareServiceLog(log.id, user);
    return jsonOk({ log }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Could not create service log", 400);
  }
}
