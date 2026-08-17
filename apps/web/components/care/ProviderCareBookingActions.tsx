"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function ProviderCareBookingActions({ careBookingId }: { careBookingId: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="default"
        size="default"
        onClick={async () => {
          await fetch(`/api/care/bookings/${careBookingId}/accept`, { method: "POST" });
          router.refresh();
        }}
      >
        Accept booking
      </Button>
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={async () => {
          await fetch(`/api/care/bookings/${careBookingId}/decline`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: "Unable to deliver" }),
          });
          router.refresh();
        }}
      >
        Decline
      </Button>
    </div>
  );
}
