"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function JobPublishAction({ jobId }: { jobId: string }) {
  const router = useRouter();
  return (
    <Button
      variant="default"
      size="default"
      onClick={async () => {
        await fetch(`/api/jobs/${jobId}/publish`, { method: "POST" });
        router.refresh();
      }}
    >
      Publish job
    </Button>
  );
}
