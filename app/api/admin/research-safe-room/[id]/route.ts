import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  activateResearchProject,
  archiveResearchProject,
  submitForEthicsReview,
} from "@/lib/research/safe-room/safe-room-service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { id } = await params;
  const body = await req.json();

  try {
    if (body.action === "ethics") {
      const project = await submitForEthicsReview(id);
      return jsonOk({ project });
    }
    if (body.action === "activate") {
      const project = await activateResearchProject(id, user.id);
      return jsonOk({ project });
    }
    if (body.action === "archive") {
      const project = await archiveResearchProject(id, user.id);
      return jsonOk({ project });
    }
    return jsonError("INVALID_ACTION", 400);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "SAFE_ROOM_ACTION_FAILED",
      400
    );
  }
}
