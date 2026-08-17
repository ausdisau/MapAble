import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { closeJob } from "@/lib/jobs/job-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const user = await requireApiPermission("jobs:manage:employer");
  if (user instanceof Response) return user;
  const { jobId } = await params;
  const job = await closeJob(jobId, user.id);
  return jsonOk({ job });
}
