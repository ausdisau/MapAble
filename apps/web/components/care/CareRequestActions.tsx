"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CareRequestActions({
  careRequestId,
  status,
  linkedTransportRequired,
}: {
  careRequestId: string;
  status: string;
  linkedTransportRequired: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    await fetch(`/api/care/requests/${careRequestId}/submit`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  async function linkTransport() {
    setLoading(true);
    await fetch("/api/orchestration/care-transport/from-care-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ careRequestId }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-3">
      {status === "draft" ? (
        <Button type="button" variant="default" size="default" loading={loading} onClick={submit}>
          Submit request
        </Button>
      ) : null}
      {linkedTransportRequired && status !== "draft" ? (
        <Button type="button" variant="outline" size="default" loading={loading} onClick={linkTransport}>
          Create linked transport draft
        </Button>
      ) : null}
    </div>
  );
}
