import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { submitWorkerScreeningCheck } from "@/lib/workers/worker-screening-service";

/**
 * NDIS Worker Screening certificate upload (Replit `verify-worker-check` port).
 * Multipart: jurisdiction + certificate file.
 */
export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const form = await req.formData();
  const jurisdiction = String(form.get("jurisdiction") ?? "");
  const file =
    (form.get("certificate") as File | null) ??
    (form.get("file") as File | null);

  if (!file) return jsonError("certificate file required", 400);

  try {
    const result = await submitWorkerScreeningCheck({
      userId: user.id,
      jurisdiction,
      file,
    });
    return jsonOk(result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "INVALID_JURISDICTION") {
      return jsonError("Select a valid Australian state or territory", 400);
    }
    if (message === "WORKER_PROFILE_NOT_FOUND") {
      return jsonError("Worker profile not found", 404);
    }
    if (message.startsWith("UPLOAD_INVALID:")) {
      return jsonError(message.replace("UPLOAD_INVALID:", ""), 400);
    }
    throw error;
  }
}
