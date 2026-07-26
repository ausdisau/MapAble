import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  getLaunchReadinessSummary,
  completeLaunchItem,
} from "@/lib/platform/launch-readiness/launch-readiness-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getLaunchReadinessSummary());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const item = await completeLaunchItem(
    body.itemId,
    user.id,
    body.evidenceDocumentId
  );
  return jsonOk({ item });
}
