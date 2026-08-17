"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CareShiftApproval({
  shiftId,
  status,
}: {
  shiftId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status !== "awaiting_participant_approval") {
    return (
      <p className="text-sm text-muted-foreground">
        Participant approval is required when a shift is completed and checked
        out.
      </p>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <h2 className="font-semibold">Approve completed shift</h2>
      <p className="mt-1 text-sm">
        Approving confirms the service record. Invoice draft lines may be created
        after approval — amounts require human review.
      </p>
      <Button
        className="mt-4"
        variant="default"
        size="default"
        loading={loading}
        onClick={async () => {
          setLoading(true);
          await fetch(`/api/care/shifts/${shiftId}/approve`, { method: "POST" });
          setLoading(false);
          router.refresh();
        }}
      >
        Approve shift
      </Button>
    </div>
  );
}
