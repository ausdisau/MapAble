import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  addLifeTwinDomainRecord,
  deleteOptionalMemory,
  disputeLifeTwinDomainRecord,
  getLifeTwin,
  rememberPreference,
  removeLifeTwinDomainRecord,
  updateLifeTwin,
} from "@/lib/intelligence/careos/life-twin/service";
import {
  lifeTwinDomainRecordSchema,
  lifeTwinPreferencesSchema,
} from "@/lib/intelligence/careos/life-twin/types";

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
    const body = await request.json();
    if ("domain" in body) {
      return jsonOk(
        {
          domainRecord: await addLifeTwinDomainRecord(
            user.id,
            lifeTwinDomainRecordSchema.parse(body)
          ),
        },
        201
      );
    }
    return jsonOk({ memory: await rememberPreference({ participantId: user.id, ...memorySchema.parse(body) }) }, 201);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return jsonError(error instanceof Error ? error.message : "Update failed", 400);
  }
}

export async function DELETE(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const memoryId = new URL(request.url).searchParams.get("memoryId");
  const domainRecordId = new URL(request.url).searchParams.get("domainRecordId");
  if (!memoryId && !domainRecordId) return jsonError("memoryId or domainRecordId is required");
  if (domainRecordId) {
    await removeLifeTwinDomainRecord(user.id, domainRecordId);
  } else if (memoryId) {
    await deleteOptionalMemory(user.id, memoryId);
  }
  return jsonOk({ deleted: true });
}

export async function PUT(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const recordId = new URL(request.url).searchParams.get("disputeDomainRecordId");
  if (!recordId) return jsonError("disputeDomainRecordId is required");
  await disputeLifeTwinDomainRecord(user.id, recordId);
  return jsonOk({ disputed: true });
}
