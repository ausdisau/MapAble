import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  markMeetingHeld,
  publishMeetingMinutes,
} from "@/lib/governance/oversight-board/oversight-service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { id } = await params;
  const body = await req.json();

  try {
    if (body.action === "held") {
      const meeting = await markMeetingHeld(id, user.id);
      return jsonOk({ meeting });
    }
    if (body.action === "minutes") {
      const meeting = await publishMeetingMinutes(
        id,
        body.minutesSummary ?? "Minutes published.",
        user.id
      );
      return jsonOk({ meeting });
    }
    return jsonError("INVALID_ACTION", 400);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "OVERSIGHT_ACTION_FAILED",
      400
    );
  }
}
