import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listPublishedCivicAudits,
  publishCivicAuditIndex,
} from "@/lib/platform/institutional-permanence/permanence-service";

export async function GET() {
  const user = await requireApiAdminScope("accountability:publish");
  if (user instanceof Response) return user;
  return jsonOk({ audits: await listPublishedCivicAudits() });
}

export async function POST(req: Request) {
  const user = await requireApiAdminScope("accountability:publish");
  if (user instanceof Response) return user;
  const body = await req.json();
  const audit = await publishCivicAuditIndex({
    ...body,
    actorUserId: user.id,
  });
  return jsonOk({ audit }, 201);
}
