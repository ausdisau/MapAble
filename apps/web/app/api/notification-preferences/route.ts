import { ZodError , z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { ensureDefaultPreferences } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

const prefSchema = z.object({
  preferences: z.array(
    z.object({
      category: z.enum([
        "booking",
        "profile",
        "consent",
        "provider",
        "billing",
        "support",
        "safeguarding",
        "system",
      ]),
      channel: z.enum(["in_app", "email", "sms", "push"]),
      enabled: z.boolean(),
    })
  ),
});

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  await ensureDefaultPreferences(user.id);
  const preferences = await prisma.notificationPreference.findMany({
    where: { userId: user.id },
  });

  return jsonOk({ preferences });
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const { preferences } = prefSchema.parse(await req.json());
    for (const pref of preferences) {
      await prisma.notificationPreference.upsert({
        where: {
          userId_category_channel: {
            userId: user.id,
            category: pref.category,
            channel: pref.channel,
          },
        },
        create: { userId: user.id, ...pref },
        update: { enabled: pref.enabled },
      });
    }
    const updated = await prisma.notificationPreference.findMany({
      where: { userId: user.id },
    });
    return jsonOk({ preferences: updated });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Update failed", 500);
  }
}
