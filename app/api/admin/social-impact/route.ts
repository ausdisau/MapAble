import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  getSocialImpactDashboard,
  recordSocialImpactOutcome,
} from "@/lib/research/social-impact/impact-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getSocialImpactDashboard());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const outcome = await recordSocialImpactOutcome({
    outcomeKey: body.outcomeKey,
    value: body.value,
    cohortSize: body.cohortSize,
    definition: body.definition,
  });
  return jsonOk({ outcome }, 201);
}
