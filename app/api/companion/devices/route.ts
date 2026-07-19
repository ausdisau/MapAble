import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  enrolCompanionDevice,
  revokeCompanionDevice,
} from "@/lib/companion/device-registry";
import { isCompanionEnabled } from "@/lib/config/companion";
import {
  companionDeviceEnrolSchema,
  companionDeviceRevokeSchema,
} from "@/mobile-contracts/schemas/companion-device";

export async function POST(req: Request) {
  if (!isCompanionEnabled()) {
    return jsonError("Companion is not enabled", 503);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "reason" in body &&
    !("platform" in body)
  ) {
    try {
      const parsed = companionDeviceRevokeSchema.parse(body);
      const revoked = revokeCompanionDevice({
        userId: user.id,
        deviceId: parsed.deviceId,
        reason: parsed.reason,
      });
      if (!revoked) return jsonError("Device not found", 404);
      return jsonOk({ device: revoked, remoteSignOutRequired: true });
    } catch (err) {
      if (err instanceof ZodError) return zodErrorResponse(err);
      throw err;
    }
  }

  try {
    const parsed = companionDeviceEnrolSchema.parse(body);
    const device = enrolCompanionDevice({
      deviceId: parsed.deviceId,
      userId: user.id,
      platform: parsed.platform,
      appVersion: parsed.appVersion,
      pushToken: parsed.pushToken,
    });
    return jsonOk({ device }, 201);
  } catch (err) {
    if (err instanceof ZodError) return zodErrorResponse(err);
    throw err;
  }
}
