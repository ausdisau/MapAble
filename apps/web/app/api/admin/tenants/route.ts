import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { createTenant } from "@/lib/platform/multi-tenant-admin/tenant-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const tenants = await prisma.tenant.findMany({ include: { memberships: true } });
  return jsonOk({ tenants });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const tenant = await createTenant(body.slug, body.name);
  return jsonOk({ tenant }, 201);
}
