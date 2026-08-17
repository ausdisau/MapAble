"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { useState } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import { Button } from "@/components/ui/button";

export function PasskeyRegistrationPanel({
  passkeyCount,
}: {
  passkeyCount: number;
}) {
  const [count, setCount] = useState(passkeyCount);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const registerPasskey = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const optionsResponse = await fetch("/api/passkeys/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const optionsData = (await optionsResponse.json()) as {
        challengeToken?: string;
        error?: string;
        options?: Parameters<typeof startRegistration>[0];
      };

      if (
        !optionsResponse.ok ||
        !optionsData.options ||
        !optionsData.challengeToken
      ) {
        setError(optionsData.error || "Could not start passkey setup.");
        setIsLoading(false);
        return;
      }

      const credential = await startRegistration(optionsData.options);
      const verifyResponse = await fetch("/api/passkeys/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken: optionsData.challengeToken,
          credential,
        }),
      });
      const verifyData = (await verifyResponse.json()) as { error?: string };

      if (!verifyResponse.ok) {
        setError(verifyData.error || "Could not save passkey.");
        setIsLoading(false);
        return;
      }

      setCount((value) => value + 1);
      setSuccess("Passkey added. You can use it the next time you sign in.");
      setIsLoading(false);
    } catch {
      setError("Passkey setup was cancelled or failed.");
      setIsLoading(false);
    }
  };

  return (
    <section className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-4 text-sm">
      <div>
        <h2 className="font-heading text-lg font-semibold">Passkeys</h2>
        <p className="text-muted-foreground">
          Sign in with your device lock, fingerprint, face unlock, or security
          key.
        </p>
      </div>

      <p className="text-muted-foreground">
        {count === 0
          ? "No passkeys are registered yet."
          : `${count} passkey${count === 1 ? "" : "s"} registered.`}
      </p>

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
      {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

      <Button
        type="button"
        variant="outline"
        size="default"
        loading={isLoading}
        disabled={isLoading}
        onClick={registerPasskey}
      >
        {isLoading ? "Adding passkey…" : "Add a passkey"}
      </Button>
    </section>
  );
}
