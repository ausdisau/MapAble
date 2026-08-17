import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { publishJob } from "@/lib/jobs/job-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const { jobId } = await params;
  const job = await publishJob(jobId, user.id);
  return jsonOk({ job });
}
