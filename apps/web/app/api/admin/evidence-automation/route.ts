import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { runEvidenceAutomationJob } from "@/lib/evidence/automation/evidence-job-service";

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const job = await runEvidenceAutomationJob(body.jobType ?? "soc_iso_snapshot");
  return jsonOk({ job });
}
