import { NotificationSettingsForm } from "@/components/notifications/NotificationSettingsForm";
import { requireAuth } from "@/lib/auth/guards";
import { ensureDefaultPreferences } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Notification settings | MapAble Core" };

export default async function NotificationSettingsPage() {
  const user = await requireAuth();
  await ensureDefaultPreferences(user.id);
  const preferences = await prisma.notificationPreference.findMany({
    where: { userId: user.id },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">
          Notification settings
        </h1>
        <p className="text-muted-foreground">
          Choose how MapAble contacts you. Status labels always include text, not
          colour alone.
        </p>
      </header>
      <NotificationSettingsForm
        initial={preferences.map((p) => ({
          category: p.category,
          channel: p.channel,
          enabled: p.enabled,
        }))}
      />
    </div>
  );
}
