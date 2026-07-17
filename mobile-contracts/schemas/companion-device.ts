import { z } from "zod";

export const companionDeviceEnrolSchema = z
  .object({
    deviceId: z.string().min(8).max(128),
    platform: z.enum(["ios", "android"]),
    appVersion: z.string().max(32),
    pushToken: z.string().max(512).optional(),
  })
  .strict();

export const companionDeviceRevokeSchema = z
  .object({
    deviceId: z.string().min(8).max(128),
    reason: z.enum(["lost", "stolen", "user_request", "security"]),
  })
  .strict();
