import { prisma } from "@/lib/prisma";

export const metadata = { title: "Notifications | Admin" };

export default async function AdminNotificationsPage() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">System notifications</h1>
      <ul className="space-y-2 text-sm">
        {notifications.map((n) => (
          <li key={n.id} className="rounded-lg border border-border bg-card p-3">
            <strong>{n.title}</strong> — {n.user.name}
            <p className="text-muted-foreground">{n.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
