import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  getOperatorDispatchBoard,
  reassignDriver,
} from "@/lib/transport/operator-dispatch/operator-dispatch-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getOperatorDispatchBoard());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const board = await reassignDriver({
    boardId: body.boardId,
    toDriverId: body.toDriverId,
    reason: body.reason ?? "Operational reassignment",
    actorUserId: user.id,
  });
  return jsonOk({ board });
}
