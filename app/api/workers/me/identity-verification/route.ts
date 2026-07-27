import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getIdentityVerificationStatus,
  startIdentityVerification,
} from "@/lib/workers/identity-verification-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const status = await getIdentityVerificationStatus(user.id);
  if (!status) {
    return jsonError("Worker profile not found", 404);
  }
  return jsonOk({ status });
}

export async function POST() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const result = await startIdentityVerification(user.id);
    return jsonOk(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "WORKER_PROFILE_NOT_FOUND") {
      return jsonError("Worker profile not found", 404);
    }
    if (message === "STRIPE_IDENTITY_NOT_IMPLEMENTED") {
      return jsonError(
        "Stripe Identity is enabled but session creation is not yet available. Contact support.",
        501,
      );
    }
    throw error;
  }
}
