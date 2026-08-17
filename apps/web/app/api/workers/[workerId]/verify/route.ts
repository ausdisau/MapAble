import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { verifyWorkerProfile } from "@/lib/workers/worker-profile-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workerId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { workerId } = await params;
  const body = await req.json();
  const status = body.verificationStatus;
  if (!["verified", "rejected", "pending_review"].includes(status)) {
    return jsonError("Invalid status", 400);
  }
  const profile = await verifyWorkerProfile(workerId, status, user.id);
  return jsonOk({ profile });
}
