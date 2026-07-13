import { ZodError } from "zod";
import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { deleteOptionalMemory, getLifeTwin, rememberPreference, updateLifeTwin } from "@/lib/intelligence/careos/life-twin/service";
import { lifeTwinPreferencesSchema } from "@/lib/intelligence/careos/life-twin/types";

const memorySchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z.unknown(),
  consentScope: z.string().optional(),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  return jsonOk({ lifeTwin: await getLifeTwin(user.id) });
}

export async function PATCH(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    return jsonOk({ lifeTwin: await updateLifeTwin(user.id, lifeTwinPreferencesSchema.parse(await request.json())) });
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return jsonError("Update failed", 500);
  }
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    return jsonOk({ memory: await rememberPreference({ participantId: user.id, ...memorySchema.parse(await request.json()) }) }, 201);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return jsonError(error instanceof Error ? error.message : "Update failed", 400);
  }
}

export async function DELETE(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const memoryId = new URL(request.url).searchParams.get("memoryId");
  if (!memoryId) return jsonError("memoryId is required");
  await deleteOptionalMemory(user.id, memoryId);
  return jsonOk({ deleted: true });
}
