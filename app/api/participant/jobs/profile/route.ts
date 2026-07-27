import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  getEmploymentProfile,
  upsertEmploymentProfile,
} from "@/lib/jobs/participants/employment-profile-service";

const profileSchema = z.object({
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  preferredWorkTypes: z.array(z.string()).optional(),
  preferredHours: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  remotePreference: z.string().nullable().optional(),
  communicationPrefs: z.record(z.string(), z.unknown()).optional(),
  adjustmentPrefs: z.record(z.string(), z.unknown()).optional(),
  disclosureChoices: z.record(z.string(), z.unknown()).optional(),
  transportDependency: z.boolean().optional(),
  supportDependency: z.boolean().optional(),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    return jsonOk({ profile: await getEmploymentProfile(user.id) });
  } catch (e) {
    if (e instanceof Error && e.message === "JOBS_PARTICIPATION_DISABLED") {
      return jsonError("Jobs participation is unavailable", 503);
    }
    return jsonError("Failed to load profile", 500);
  }
}

export async function PATCH(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const {
      communicationPrefs,
      adjustmentPrefs,
      disclosureChoices,
      ...rest
    } = parsed.data;
    return jsonOk({
      profile: await upsertEmploymentProfile({
        participantId: user.id,
        actorUserId: user.id,
        ...rest,
        communicationPrefs: communicationPrefs as
          | Prisma.InputJsonValue
          | undefined,
        adjustmentPrefs: adjustmentPrefs as Prisma.InputJsonValue | undefined,
        disclosureChoices: disclosureChoices as
          | Prisma.InputJsonValue
          | undefined,
      }),
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "JOBS_PARTICIPATION_DISABLED") {
        return jsonError("Jobs participation is unavailable", 503);
      }
      if (e.message === "PARTICIPANT_AUTHORITY_REQUIRED") {
        return jsonError("Participant authority required", 403);
      }
    }
    return jsonError("Failed to update profile", 500);
  }
}
