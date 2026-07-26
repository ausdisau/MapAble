import type { PublicApiVersionStatus } from "@prisma/client";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  getApiVersionPolicy,
  updateApiVersionStatus,
} from "@/lib/api/versioning/version-policy-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getApiVersionPolicy());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const version = await updateApiVersionStatus(
    body.version,
    body.status as PublicApiVersionStatus
  );
  return jsonOk({ version });
}
