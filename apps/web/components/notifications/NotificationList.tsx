"use client";

import { StatusBadge } from "@/components/ui/status-badge";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: string;
  readAt: string | Date | null;
  createdAt: string | Date;
}

export function NotificationList({
  notifications,
  onMarkRead,
}: {
  notifications: NotificationItem[];
  onMarkRead?: (id: string) => void;
}) {
  if (!notifications.length) {
    return (
      <p className="text-muted-foreground" role="status">
        You have no notifications yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Notifications">
      {notifications.map((n) => (
        <li
          key={n.id}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-semibold">{n.title}</h3>
            {n.readAt ? (
              <StatusBadge status="completed" />
            ) : (
              <StatusBadge status="pending" />
            )}
          </div>
          <p className="mt-1 text-sm">{n.body}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {new Date(n.createdAt).toLocaleString("en-AU")} · {n.category}
          </p>
          {!n.readAt && onMarkRead ? (
            <button
              type="button"
              className="mt-3 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onMarkRead(n.id)}
            >
              Mark as read
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
