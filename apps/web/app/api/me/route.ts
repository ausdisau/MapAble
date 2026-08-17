import { ZodError , z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const patchMeSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().max(30).optional().nullable(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  preferredContactMethod: z.enum(["email", "phone", "sms"]).optional(),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      timezone: true,
      locale: true,
      preferredContactMethod: true,
      primaryRole: true,
      createdAt: true,
    },
  });

  return jsonOk({ user: record });
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = patchMeSchema.parse(await req.json());
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: body,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        timezone: true,
        locale: true,
        preferredContactMethod: true,
        primaryRole: true,
      },
    });
    return jsonOk({ user: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Update failed", 500);
  }
}
