import { requireApiAdmin, requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createSupportItemSchema } from "@/lib/ndis/schemas";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const items = await prisma.ndisSupportItem.findMany({
    where: { active: true },
    orderBy: { code: "asc" },
    take: 200,
  });
  return jsonOk({ items });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (isResponse(user)) return user;
  const parsed = createSupportItemSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const body = parsed.data;
  const item = await prisma.ndisSupportItem.create({
    data: {
      code: body.code,
      name: body.name,
      categoryLabel: body.category,
      unitType: body.unitType ?? "hour",
      priceCapCents: body.priceCapCents,
      effectiveFrom: body.effectiveFrom
        ? new Date(body.effectiveFrom)
        : new Date(),
      active: true,
    },
  });
  return jsonOk({ item }, 201);
}
