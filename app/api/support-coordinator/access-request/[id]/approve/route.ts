import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { approveCoordinatorAccess } from "@/lib/support/coordinator/relationship-service";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  if (body.participantId && body.participantId !== user.id) {
    return jsonError("Only the participant can approve", 403);
  }

  const rel = await approveCoordinatorAccess(id, user.id);
  return jsonOk({ relationship: rel });
}
