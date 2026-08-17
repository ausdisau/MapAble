"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function RevokeConsentButton({ consentId }: { consentId: string }) {
  const [loading, setLoading] = useState(false);

  async function revoke() {
    setLoading(true);
    await fetch("/api/consent/micro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke", consentId }),
    });
    window.location.reload();
  }

  return (
    <Button
      type="button"
      size="default"
      variant="outline"
      disabled={loading}
      onClick={() => void revoke()}
    >
      {loading ? "Revoking…" : "Revoke"}
    </Button>
  );
}
