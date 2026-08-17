"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function ProviderTransportActions({
  transportBookingId,
}: {
  transportBookingId: string;
}) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="default"
        size="default"
        onClick={async () => {
          await fetch(`/api/transport/bookings/${transportBookingId}/accept`, {
            method: "POST",
          });
          router.refresh();
        }}
      >
        Accept
      </Button>
      <Button
        variant="outline"
        size="default"
        onClick={async () => {
          await fetch(`/api/transport/bookings/${transportBookingId}/decline`, {
            method: "POST",
          });
          router.refresh();
        }}
      >
        Decline
      </Button>
    </div>
  );
}
