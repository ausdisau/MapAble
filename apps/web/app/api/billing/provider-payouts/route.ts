import { jsonOk } from "@/lib/api/response";
import {
  isResponse,
  requireBillingPermission,
} from "@/lib/billing/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireBillingPermission("billing:manage_payouts");
  if (isResponse(user)) return user;

  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId");

  const payouts = await prisma.billingCentreProviderPayout.findMany({
    where: organisationId ? { organisationId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return jsonOk({ payouts });
}
