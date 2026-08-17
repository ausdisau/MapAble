import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { publishAlgorithm } from "@/lib/compliance/algorithm-register/register-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const algorithms = await prisma.registeredAlgorithm.findMany({
    orderBy: { createdAt: "desc" },
  });
  return jsonOk({ algorithms });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const algorithm = await publishAlgorithm(body);
  return jsonOk({ algorithm }, 201);
}
