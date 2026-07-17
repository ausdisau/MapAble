"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AccessHistoryActions() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadExport() {
    setExporting(true);
    setError(null);
    const res = await fetch("/api/trust-fabric/export");
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Export failed");
      setExporting(false);
      return;
    }
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mapable-trust-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="default"
        size="default"
        onClick={() => void downloadExport()}
        disabled={exporting}
      >
        {exporting ? "Preparing export…" : "Export my information"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Download a machine-readable copy of your passport subset, active
        authority, access history, and service summaries.
      </p>
      {error ? (
        <p className="w-full text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
