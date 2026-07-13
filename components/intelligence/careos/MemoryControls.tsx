"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function MemoryControls() {
  const [message, setMessage] = useState("");

  async function clearMemory() {
    setMessage("Select a saved preference in My CareOS activity to remove it. Operational care records are not removed here.");
  }

  return (
    <section aria-labelledby="careos-memory-heading" className="rounded-xl border bg-card p-5">
      <h2 id="careos-memory-heading" className="font-heading text-xl font-bold">Memory controls</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        CareOS does not retain conversational memory by default. Optional remembered preferences are participant-controlled.
      </p>
      <Button className="mt-4" onClick={clearMemory} variant="outline" size="default">
        Clear optional memory
      </Button>
      <p className="mt-3 text-sm" aria-live="polite">{message}</p>
    </section>
  );
}
