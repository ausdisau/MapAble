"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function ProviderCareActions({ careRequestId }: { careRequestId: string }) {
  const router = useRouter();
  return (
    <div className="flex gap-3">
      <Button
        variant="default"
        size="default"
        onClick={async () => {
          await fetch(`/api/care/requests/${careRequestId}/accept`, {
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
          await fetch(`/api/care/requests/${careRequestId}/decline`, {
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
