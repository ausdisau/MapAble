import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  createSecurityAuditPack,
  listSecurityAuditPacks,
  publishSecurityAuditPack,
} from "@/lib/security/external-audit/audit-pack-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ packs: await listSecurityAuditPacks() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (body.packId) {
    const pack = await publishSecurityAuditPack(body.packId);
    return jsonOk({ pack });
  }
  const pack = await createSecurityAuditPack({
    title: body.title,
    framework: body.framework,
    evidence: body.evidence,
  });
  return jsonOk({ pack }, 201);
}
