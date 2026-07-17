import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  compileVisitPack,
  visitPackIntegrityHash,
} from "@/lib/companion/visit-pack-compile";
import { isCompanionVisitPackEnabled } from "@/lib/config/companion";
import { isCommunicationPassportEnabled } from "@/lib/config/communication-workforce";

const schema = z
  .object({
    careSummary: z.string().max(2000).optional(),
    transportSummary: z.string().max(2000).optional(),
    venueSummary: z.string().max(2000).optional(),
    ttlHours: z.number().int().min(1).max(72).optional(),
  })
  .strict();

export async function POST(req: Request) {
  if (!isCompanionVisitPackEnabled() || !isCommunicationPassportEnabled()) {
    return jsonError("Companion Visit Pack is not enabled", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const parsed = schema.parse(body ?? {});
    const pack = await compileVisitPack({
      participantId: user.id,
      ...parsed,
    });
    return jsonOk({
      pack,
      integrityHash: visitPackIntegrityHash(pack),
      storageHint:
        "Store only in Companion encrypted local database. Never plain AsyncStorage.",
    });
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    throw err;
  }
}
