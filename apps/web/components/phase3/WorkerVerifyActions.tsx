"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function WorkerVerifyActions({ workerId }: { workerId: string }) {
  const router = useRouter();
  async function verify(status: string) {
    await fetch(`/api/workers/${workerId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationStatus: status }),
    });
    router.refresh();
  }
  return (
    <div className="flex gap-2">
      <Button variant="default" size="default" onClick={() => verify("verified")}>
        Mark verified
      </Button>
      <Button variant="outline" size="default" onClick={() => verify("rejected")}>
        Reject
      </Button>
    </div>
  );
}
