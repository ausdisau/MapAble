import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getOutboxRelayStatus,
  runOutboxRelayOnce,
  startOutboxRelayWorker,
  stopOutboxRelayWorker,
} from "@/lib/platform/outbox-relay-worker";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  return jsonOk(getOutboxRelayStatus());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    limit?: number;
    intervalMs?: number;
  };

  switch (body.action) {
    case "run-once":
      return jsonOk(await runOutboxRelayOnce({ limit: body.limit }));
    case "start":
      return jsonOk(startOutboxRelayWorker({ intervalMs: body.intervalMs }));
    case "stop":
      return jsonOk(stopOutboxRelayWorker());
    default:
      return jsonError("Unknown action; use run-once, start, or stop", 400);
  }
}
