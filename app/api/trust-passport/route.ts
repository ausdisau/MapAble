import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError } from "@/lib/api/response";
import {
  presentCredential,
  verifyPresentation,
} from "@/lib/trust/passport/trust-passport-service";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => ({}));
  const { action, workerProfileId, credentialId, credentialType } = body;

  try {
    if (action === "present") {
      const result = await presentCredential({
        workerProfileId: String(workerProfileId),
        credentialType: String(credentialType ?? "worker_screening_bundle"),
        actorUserId: user.id,
      });
      return NextResponse.json(result);
    }
    if (action === "verify") {
      const credential = await verifyPresentation({
        credentialId: String(credentialId),
        actorUserId: user.id,
      });
      return NextResponse.json({ credential });
    }
    return jsonError("Unknown action", 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed";
    if (message === "TRUST_PASSPORT_PILOT_DISABLED") {
      return jsonError("Trust passport pilot disabled", 403);
    }
    return jsonError(message, 400);
  }
}
