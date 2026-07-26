import {
  publishAlgorithmById,
  submitAlgorithmForReview,
} from "@/lib/compliance/algorithm-register/register-service";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { id } = await params;
  const body = await req.json();

  try {
    if (body.action === "review") {
      const algorithm = await submitAlgorithmForReview(id);
      return jsonOk({ algorithm });
    }
    if (body.action === "publish") {
      const algorithm = await publishAlgorithmById(id);
      return jsonOk({ algorithm });
    }
    return jsonError("INVALID_ACTION", 400);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "ALGORITHM_ACTION_FAILED",
      400
    );
  }
}
