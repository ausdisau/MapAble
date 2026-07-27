import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  listActiveSessions,
  revokeAllAuthSessions,
  revokeAuthSession,
} from "@/lib/identity/identity-security-service";

const deleteSchema = z.union([
  z.object({ sessionId: z.string().min(1) }),
  z.object({ all: z.literal(true) }),
]);

export async function GET() {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  const sessions = await listActiveSessions(actor.id);
  return jsonOk({ sessions });
}

export async function DELETE(request: Request) {
  const actor = await requireApiSession();
  if (actor instanceof Response) return actor;

  const parsed = deleteSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    if ("all" in parsed.data) {
      const count = await revokeAllAuthSessions({ userId: actor.id });
      return jsonOk({ revoked: count });
    }

    await revokeAuthSession({
      userId: actor.id,
      sessionId: parsed.data.sessionId,
    });
    return jsonOk({ revoked: 1 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Revoke failed";
    if (message === "SESSION_NOT_FOUND") {
      return jsonError("Session not found", 404);
    }
    return jsonError(message, 400);
  }
}
