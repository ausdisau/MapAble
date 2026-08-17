import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { completeVaultRequest } from "@/lib/personal-data-vault/vault-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const requests = await prisma.personalDataVaultRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return jsonOk({ requests });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const request = await completeVaultRequest(body.requestId, user.id);
  return jsonOk({ request });
}
