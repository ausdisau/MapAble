"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthFormCard } from "@/components/auth/AuthFormCard";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { normalizeAuthEmail } from "@/lib/auth/auth-flow";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AuthFormCard
      title="Reset your password"
      description="We will email you a link if an account exists for this address."
      footer={
        <>
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setMessage("");
          setIsLoading(true);

          try {
            const res = await fetch("/api/auth/forgot-password", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: normalizeAuthEmail(email) }),
            });
            const data = (await res.json()) as {
              message?: string;
              error?: string;
            };

            if (!res.ok) {
              setError(data.error || "Could not send reset instructions.");
              setIsLoading(false);
              return;
            }

            setMessage(
              data.message ||
                "If an account exists for that email, we sent password reset instructions."
            );
            setIsLoading(false);
          } catch {
            setError("Something went wrong. Please try again.");
            setIsLoading(false);
          }
        }}
      >
        <AccessibleFormField id="forgot-email" label="Email" required>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className={formInputClass}
          />
        </AccessibleFormField>

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
        {message ? <AuthAlert variant="success">{message}</AuthAlert> : null}

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={isLoading}
          loading={isLoading}
        >
          {isLoading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthFormCard>
  );
}
