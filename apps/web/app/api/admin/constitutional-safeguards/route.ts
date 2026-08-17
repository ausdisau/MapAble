import { requireApiAdminScope } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listActiveSafeguards } from "@/lib/governance/constitutional-safeguards/safeguards-service";
import { upsertConstitutionalSafeguard } from "@/lib/platform/institutional-permanence/permanence-service";

export async function GET() {
  const user = await requireApiAdminScope("safeguards:manage");
  if (user instanceof Response) return user;
  return jsonOk({ articles: await listActiveSafeguards() });
}

export async function POST(req: Request) {
  const user = await requireApiAdminScope("safeguards:manage");
  if (user instanceof Response) return user;
  const body = await req.json();
  const article = await upsertConstitutionalSafeguard({
    ...body,
    actorUserId: user.id,
  });
  return jsonOk({ article }, 201);
}
