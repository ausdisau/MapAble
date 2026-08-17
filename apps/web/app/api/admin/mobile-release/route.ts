import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  addReleaseBlocker,
  getReleaseHardeningStatus,
  registerReleaseCandidate,
} from "@/lib/platform/mobile-release/release-hardening-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ candidates: await getReleaseHardeningStatus() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.action === "add_blocker") {
    const blocker = await addReleaseBlocker(
      body.candidateId,
      body.code,
      body.description
    );
    return jsonOk({ blocker }, 201);
  }
  const candidate = await registerReleaseCandidate(
    body.platform ?? "ios",
    body.version ?? "0.0.0"
  );
  return jsonOk({ candidate }, 201);
}
