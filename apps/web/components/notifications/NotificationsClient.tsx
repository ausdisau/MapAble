"use client";

import { useRouter } from "next/navigation";

import { NotificationList } from "@/components/notifications/NotificationList";

export function NotificationsClient({
  initial,
}: {
  initial: {
    id: string;
    title: string;
    body: string;
    category: string;
    readAt: string | null;
    createdAt: string;
  }[];
}) {
  const router = useRouter();

  return (
    <NotificationList
      notifications={initial}
      onMarkRead={async (id) => {
        await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
        router.refresh();
      }}
    />
  );
}
