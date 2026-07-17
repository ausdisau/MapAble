import { jsonOk } from "@/lib/api/response";
import {
  isResponse,
  requireAnyBillingPermission,
} from "@/lib/billing/api-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireAnyBillingPermission([
    "billing:view_all",
    "billing:manage_policy",
    "billing:view_provider",
  ]);
  if (isResponse(user)) return user;

  const url = new URL(req.url);
  const organisationId = url.searchParams.get("organisationId");

  const policies = await prisma.pricingPolicy.findMany({
    where: organisationId
      ? {
          OR: [{ organisationId }, { organisationId: null }],
        }
      : undefined,
    include: {
      versions: {
        orderBy: { effectiveFrom: "desc" },
        include: {
          rules: {
            take: 50,
            orderBy: { supportItemNumber: "asc" },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return jsonOk({ policies });
}
