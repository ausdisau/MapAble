import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  syncOperationalQueues,
  recordDispatchAction,
} from "@/lib/transport/dispatch-console/dispatch-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const queues = await syncOperationalQueues(user.id);
  return jsonOk({ queues });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const action = await recordDispatchAction(
    body.queueId,
    user.id,
    body.actionType,
    body.notes
  );
  return jsonOk({ action });
}
