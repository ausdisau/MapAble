import type { JobApplicationStatus } from "@prisma/client";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { updateApplicationStatus } from "@/lib/jobs/job-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { applicationId } = await params;
  const body = await req.json();
  if (!body.status) return jsonError("status required", 400);
  const application = await updateApplicationStatus(
    applicationId,
    body.status as JobApplicationStatus,
    user.id
  );
  return jsonOk({ application });
}
