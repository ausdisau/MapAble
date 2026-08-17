import { NotificationsClient } from "@/components/notifications/NotificationsClient";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Notifications | MapAble Core" };

export default async function NotificationsPage() {
  const user = await requireAuth();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          In-app notifications use plain language. Email and SMS are stored only
          in Phase 1.
        </p>
      </header>
      <NotificationsClient
        initial={notifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
          readAt: n.readAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
