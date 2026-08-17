import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  assertParticipantAccess,
  parseCareSupportTransformBody,
  transformCareSupportRequest,
} from "@/server/api/care-support-transformer";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  try {
    const input = parseCareSupportTransformBody(body);

    let actorUserId: string | undefined;
    let actorRole: string | undefined;

    if (input.participantId) {
      const user = await requireApiSession();
      if (user instanceof Response) return user;
      try {
        assertParticipantAccess(user, input.participantId);
      } catch {
        return jsonError(
          "You can only transform care requests for your own participant profile.",
          403
        );
      }
      actorUserId = user.id;
      actorRole = user.primaryRole;
    }

    const output = await transformCareSupportRequest(input, {
      actorUserId,
      actorRole,
    });

    return jsonOk(output);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "FORBIDDEN_PARTICIPANT") {
      return jsonError("Forbidden", 403);
    }
    console.error("[care-support-transformer]", e);
    return jsonError("Could not transform care request.", 500);
  }
}
