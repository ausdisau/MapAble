"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function TrustPassportActions({
  workerProfileId,
}: {
  workerProfileId: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function presentMock() {
    setLoading(true);
    setStatus(null);
    try {
      const presentRes = await fetch("/api/trust-passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "present",
          workerProfileId,
          credentialType: "worker_screening_bundle",
        }),
      });
      const presentData = await presentRes.json();
      if (!presentRes.ok) throw new Error(presentData.error ?? "Present failed");

      setStatus(
        "Mock presentation recorded. This is not a worker screening clearance, WWCC, or competence assessment.",
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground" role="note">
        One-tap present records a mock credential only. It does not verify screening
        and does not write clearance onto your worker profile.
      </p>
      <Button
        type="button"
        variant="default"
        size="lg"
        disabled={loading}
        onClick={presentMock}
      >
        {loading ? "Presenting…" : "Present mock credential (not clearance)"}
      </Button>
      {status ? (
        <p className="text-sm text-muted-foreground" aria-live="polite" role="status">
          {status}
        </p>
      ) : null}
    </div>
  );
}
