import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import { supportCoordinationConfig } from "@/lib/config/support-coordination";
import {
  createEnquiry,
  listEnquiriesForCoordinator,
  recordResponse,
  updateEnquiryStatus,
} from "@/lib/support-coordination/provider-enquiry-service";

const createSchema = z.object({
  caseId: z.string().min(1),
  participantId: z.string().min(1),
  providerName: z.string().min(1).max(200),
  disclosurePreview: z.string().min(1).max(5000),
  organisationId: z.string().optional(),
  responseDeadline: z.string().datetime().optional(),
});

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    enquiryId: z.string().min(1),
    action: z.literal("send"),
  }),
  z.object({
    enquiryId: z.string().min(1),
    action: z.literal("withdraw"),
  }),
  z.object({
    enquiryId: z.string().min(1),
    action: z.literal("record_response"),
    responseJson: z.record(z.string(), z.unknown()),
  }),
]);

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (
    !supportCoordinationConfig.enabled ||
    !supportCoordinationConfig.enquiriesEnabled ||
    !hasPermission(user.primaryRole, "coordinator:portal")
  ) {
    return jsonOk({ enquiries: [] });
  }

  return jsonOk({ enquiries: await listEnquiriesForCoordinator(user.id) });
}

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!supportCoordinationConfig.enabled) {
    return jsonError("Support coordination is disabled", 404);
  }
  if (!supportCoordinationConfig.enquiriesEnabled) {
    return jsonError("Provider enquiries are disabled", 404);
  }
  if (!hasPermission(user.primaryRole, "coordinator:portal")) {
    return jsonError("Forbidden", 403);
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const enquiry = await createEnquiry(
      {
        ...parsed.data,
        responseDeadline: parsed.data.responseDeadline
          ? new Date(parsed.data.responseDeadline)
          : null,
      },
      user.id,
    );
    return jsonOk({ enquiry }, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "COORDINATOR_AUTHORITY_REQUIRED") {
        return jsonError("Coordinator authority required", 403);
      }
      if (error.message === "AUTOMATIC_PROVIDER_SELECTION_FORBIDDEN") {
        return jsonError("Automatic provider selection is forbidden", 403);
      }
    }
    throw error;
  }
}

export async function PATCH(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!supportCoordinationConfig.enabled) {
    return jsonError("Support coordination is disabled", 404);
  }
  if (!supportCoordinationConfig.enquiriesEnabled) {
    return jsonError("Provider enquiries are disabled", 404);
  }
  if (!hasPermission(user.primaryRole, "coordinator:portal")) {
    return jsonError("Forbidden", 403);
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    switch (parsed.data.action) {
      case "send":
        return jsonOk({
          enquiry: await updateEnquiryStatus({
            enquiryId: parsed.data.enquiryId,
            status: "sent",
            actorUserId: user.id,
          }),
        });
      case "withdraw":
        return jsonOk({
          enquiry: await updateEnquiryStatus({
            enquiryId: parsed.data.enquiryId,
            status: "withdrawn",
            actorUserId: user.id,
          }),
        });
      case "record_response":
        return jsonOk({
          enquiry: await recordResponse({
            enquiryId: parsed.data.enquiryId,
            responseJson: parsed.data.responseJson as Prisma.InputJsonValue,
            actorUserId: user.id,
          }),
        });
      default: {
        const _exhaustive: never = parsed.data;
        return jsonError(`Unknown action: ${String(_exhaustive)}`, 400);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "COORDINATOR_AUTHORITY_REQUIRED") {
        return jsonError("Coordinator authority required", 403);
      }
      if (error.message === "ENQUIRY_NOT_DRAFT") {
        return jsonError("Enquiry is not in draft status", 409);
      }
    }
    throw error;
  }
}
