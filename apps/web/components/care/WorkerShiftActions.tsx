"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function WorkerShiftActions({
  shiftId,
  status,
}: {
  shiftId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const call = async (path: string) => {
    setLoading(true);
    await fetch(path, { method: "POST" });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-2">
      {(status === "scheduled" ||
        status === "worker_assigned" ||
        status === "confirmed") && (
        <Button
          type="button"
          variant="default"
          size="default"
          disabled={loading}
          onClick={() => call(`/api/care/shifts/${shiftId}/check-in`)}
        >
          Check in
        </Button>
      )}
      {(status === "checked_in" || status === "in_progress") && (
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={loading}
          onClick={() => call(`/api/care/shifts/${shiftId}/check-out`)}
        >
          Check out
        </Button>
      )}
    </div>
  );
}
