"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type DownloadReportButtonProps = {
  format: "csv" | "pdf";
};

/**
 * Simulates exporting analytics for partner compliance tracking.
 * TODO: wire to a server action / API route that streams the real report.
 */
export function DownloadReportButton({ format }: DownloadReportButtonProps) {
  const [status, setStatus] = useState<"idle" | "working" | "done">("idle");

  async function handleClick() {
    setStatus("working");
    // Placeholder delay — replace with fetch('/api/partner/analytics/export?format=...')
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setStatus("done");
    window.setTimeout(() => setStatus("idle"), 2000);
  }

  const label =
    status === "working"
      ? `Preparing ${format.toUpperCase()}…`
      : status === "done"
        ? `${format.toUpperCase()} ready`
        : `Download ${format.toUpperCase()} Report`;

  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      onClick={() => void handleClick()}
      disabled={status === "working"}
      aria-label={`Download accessibility insights as ${format.toUpperCase()}`}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
