import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError } from "@/lib/api/response";
import { handleWorkerAssistRequest } from "@/lib/copilot/worker-assist-service";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => ({}));
  const { shiftId, prompt, workerProfileId } = body;
  if (!shiftId || !prompt || !workerProfileId) {
    return jsonError("shiftId, workerProfileId, and prompt required", 400);
  }

  try {
    const result = await handleWorkerAssistRequest({
      shiftId,
      prompt: String(prompt),
      workerProfileId: String(workerProfileId),
      actorUserId: user.id,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed";
    if (message === "WORKER_ASSIST_MONITORING_BLOCKED") {
      return jsonError("Monitoring-style requests are not supported", 400);
    }
    if (message === "SHIFT_NOT_ACTIVE") {
      return jsonError("Shift not active or not assigned to you", 403);
    }
    if (message === "WORKER_ASSIST_COPILOT_DISABLED") {
      return jsonError("Worker assist disabled", 403);
    }
    return jsonError(message, 400);
  }
}
