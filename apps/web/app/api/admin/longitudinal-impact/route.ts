import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listPublishedImpactWaves,
  publishImpactWave,
} from "@/lib/research/longitudinal-impact/impact-wave-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ waves: await listPublishedImpactWaves() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const wave = await publishImpactWave(
    body.waveLabel ?? `wave-${Date.now()}`,
    body.cohortSize ?? 10
  );
  return jsonOk({ wave }, 201);
}
