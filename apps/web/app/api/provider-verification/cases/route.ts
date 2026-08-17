import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import {
  createVerificationCase,
  submitVerificationCase,
} from "@/lib/provider/verification/verification-case-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const where = isAdminRole(user.primaryRole) ? {} : {};
  const cases = await prisma.providerVerificationCase.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jsonOk({ cases });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  const c = await createVerificationCase(body.organisationId, user.id);
  if (body.submit) await submitVerificationCase(c.id, user.id);
  return jsonOk({ case: c }, 201);
}
