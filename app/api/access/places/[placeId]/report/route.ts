import { reportAccessPlace } from "@/lib/access-map/access-place-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { reportPlaceSchema } from "@/types/access-map";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const reporterId = user.id;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }
  const parsed = reportPlaceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await reportAccessPlace({
      placeId,
      reporterId,
      reason: parsed.data.reason,
      details: parsed.data.details,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "PLACE_REPORT_ALREADY_SUBMITTED") {
      return jsonError(
        "You already reported this place recently; our team will review it",
        409
      );
    }
    throw e;
  }

  return jsonOk({ ok: true });
}
