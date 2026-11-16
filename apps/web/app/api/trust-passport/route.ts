import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  presentCredential,
  verifyPresentation,
} from "@/lib/trust/passport/trust-passport-service";
import { canReviewCapability } from "@/lib/workforce/access";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => ({}));
  const { action, workerProfileId, credentialId, credentialType } = body;

  try {
    if (action === "present") {
      const worker = await prisma.workerProfile.findFirst({
        where: { id: String(workerProfileId), userId: user.id, active: true },
        select: { id: true },
      });
      if (!worker) return jsonError("WORKER_PASSPORT_FORBIDDEN", 403);
      const result = await presentCredential({
        workerProfileId: worker.id,
        credentialType: String(credentialType ?? "worker_screening_bundle"),
        actorUserId: user.id,
      });
      return NextResponse.json({
        ...result,
        mockNotClearance: true,
        workerProfileUpdated: false,
      });
    }
    if (action === "verify") {
      if (!canReviewCapability(user)) {
        return jsonError("ASSESSOR_PERMISSION_REQUIRED", 403);
      }
      const credential = await verifyPresentation({
        credentialId: String(credentialId),
        actorUserId: user.id,
      });
      return NextResponse.json({
        credential,
        mockNotClearance: true,
        workerProfileUpdated: false,
      });
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
