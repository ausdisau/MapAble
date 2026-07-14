import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  buildDisclosurePreview,
  confirmDisclosurePreview,
  updateDisclosureChoices,
} from "@/lib/jobs/disclosure/disclosure-preview-service";

const updateSchema = z.object({
  fieldsToDisclose: z.record(z.string(), z.unknown()),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { applicationId } = await params;
  try {
    return jsonOk({
      preview: await buildDisclosurePreview(applicationId, user.id),
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "APPLICATION_NOT_FOUND") {
        return jsonError("Application not found", 404);
      }
      if (e.message === "JOBS_PARTICIPATION_DISABLED") {
        return jsonError("Jobs participation is unavailable", 503);
      }
    }
    return jsonError("Failed to build disclosure preview", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { applicationId } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    return jsonOk({
      preview: await updateDisclosureChoices({
        applicationId,
        participantId: user.id,
        fieldsToDisclose: parsed.data.fieldsToDisclose,
      }),
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "ADJUSTMENT_SHARING_NOT_ENABLED") {
        return jsonError("Enable adjustment sharing on the application first", 400);
      }
      if (e.message === "APPLICATION_NOT_FOUND") {
        return jsonError("Application not found", 404);
      }
    }
    return jsonError("Failed to update disclosure preview", 500);
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { applicationId } = await params;
  try {
    return jsonOk({
      preview: await confirmDisclosurePreview(applicationId, user.id),
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "DISCLOSURE_PREVIEW_NOT_FOUND") {
        return jsonError("Disclosure preview not found", 404);
      }
    }
    return jsonError("Failed to confirm disclosure preview", 500);
  }
}
