import type { NotificationCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createNotification(params: {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
}) {
  return prisma.notification.create({ data: params });
}

export async function ensureDefaultPreferences(userId: string) {
  const categories: NotificationCategory[] = [
    "booking",
    "profile",
    "consent",
    "provider",
    "system",
  ];
  const channels = ["in_app", "email"] as const;

  for (const category of categories) {
    for (const channel of channels) {
      await prisma.notificationPreference.upsert({
        where: {
          userId_category_channel: { userId, category, channel },
        },
        create: { userId, category, channel, enabled: true },
        update: {},
      });
    }
  }
}

export async function notifyUser(
  userId: string,
  category: NotificationCategory,
  title: string,
  body: string
) {
  const pref = await prisma.notificationPreference.findFirst({
    where: { userId, category, channel: "in_app", enabled: true },
  });
  if (!pref) return null;
  return createNotification({ userId, category, title, body });
}
