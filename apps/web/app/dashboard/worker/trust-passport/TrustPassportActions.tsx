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

  async function presentAndVerify() {
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

      const verifyRes = await fetch("/api/trust-passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          credentialId: presentData.credential.id,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error ?? "Verify failed");

      setStatus("Credential verified (pilot mock issuer).");
      window.location.reload();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="default"
        size="default"
        disabled={loading}
        onClick={presentAndVerify}
      >
        {loading ? "Presenting…" : "One-tap present (pilot)"}
      </Button>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
