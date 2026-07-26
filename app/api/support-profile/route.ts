import { ZodError , z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  getOrCreateDraftSupportProfile,
  publishSupportProfile,
  saveSupportProfileDraft,
} from "@/lib/support/profile/support-profile-service";

const patchSchema = z.object({
  routinesJson: z
    .array(z.object({ label: z.string(), detail: z.string() }))
    .optional(),
  preferencesJson: z
    .array(z.object({ label: z.string(), detail: z.string() }))
    .optional(),
  boundariesJson: z
    .array(z.object({ label: z.string(), detail: z.string() }))
    .optional(),
  escalationJson: z
    .object({
      primaryContact: z.string().optional(),
      secondaryContact: z.string().optional(),
      whenToEscalate: z.string().optional(),
      emergencyInstructions: z.string().optional(),
    })
    .optional(),
  publish: z.boolean().optional(),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const profile = await getOrCreateDraftSupportProfile(user.id);
    return jsonOk({ profile });
  } catch (e) {
    if (e instanceof Error && e.message === "SUPPORT_PROFILE_DISABLED") {
      return jsonError("Support profile is not enabled", 503);
    }
    return jsonError("Could not load support profile", 500);
  }
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const parsed = patchSchema.parse(await req.json());
    const { publish, ...patch } = parsed;
    const saved = await saveSupportProfileDraft({
      participantId: user.id,
      actorUserId: user.id,
      patch,
    });
    if (publish) {
      const published = await publishSupportProfile({
        participantId: user.id,
        actorUserId: user.id,
      });
      return jsonOk({ profile: published });
    }
    return jsonOk({ profile: saved });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "SUPPORT_PROFILE_DISABLED") {
      return jsonError("Support profile is not enabled", 503);
    }
    return jsonError("Could not save support profile", 500);
  }
}
