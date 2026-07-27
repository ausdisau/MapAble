import { requireApiPermission } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk } from "@/lib/api/response";
import { handoffCareBookingToBilling } from "@/lib/orchestration/orchestration-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireApiPermission("care:manage:org");
  if (isResponse(user)) return user;
  const { id } = await params;
  try {
    const result = await handoffCareBookingToBilling({
      careBookingId: id,
      actor: user,
    });
    return jsonOk(result, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    if (e instanceof Error && e.message === "AGREEMENT_REQUIRED") {
      return jsonError(
        "Accessible service agreement must be accepted before billing handoff",
        400,
      );
    }
    if (e instanceof Error && e.message === "SERVICE_LOG_REQUIRED") {
      return jsonError(
        "A participant-confirmed service log is required before billing handoff",
        400,
      );
    }
    return jsonError("Forbidden", 403);
  }
}
