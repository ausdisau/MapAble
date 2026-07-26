import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  CommunicationPassportError,
  getCommunicationPassport,
  updateCommunicationPassportModes,
} from "@/lib/support/communication-passport/service";
import { isCommunicationPassportEnabled } from "@/lib/config/communication-workforce";

const updateSchema = z
  .object({
    modes: z.array(z.string().min(1)).max(20),
    cognitive: z
      .object({
        oneQuestionAtATime: z.boolean().optional(),
        extraResponseTime: z.boolean().optional(),
        writtenAndSpoken: z.boolean().optional(),
        usesAac: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export async function GET() {
  if (!isCommunicationPassportEnabled()) {
    return jsonError("Communication Passport is not enabled", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const passport = await getCommunicationPassport(user.id);
    return jsonOk({ passport });
  } catch (err) {
    if (err instanceof CommunicationPassportError) {
      return jsonError(err.message, err.status);
    }
    throw err;
  }
}

export async function PUT(req: Request) {
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
    const parsed = updateSchema.parse(body);
    const passport = await updateCommunicationPassportModes({
      participantId: user.id,
      modes: parsed.modes,
      cognitive: parsed.cognitive,
    });
    return jsonOk({ passport });
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    if (err instanceof CommunicationPassportError) {
      return jsonError(err.message, err.status);
    }
    throw err;
  }
}
