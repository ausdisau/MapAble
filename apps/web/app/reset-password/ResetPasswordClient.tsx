"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-red-600">This reset link is missing or invalid.</p>
        <Link href="/forgot-password" className="underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        setIsLoading(true);

        try {
          const res = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password }),
          });
          const data = (await res.json()) as { message?: string; error?: string };

          if (!res.ok) {
            setError(data.error || "Could not reset password.");
            setIsLoading(false);
            return;
          }

          setMessage(data.message || "Password updated.");
          setIsLoading(false);
          router.push("/login?reset=success");
        } catch {
          setError("Something went wrong. Please try again.");
          setIsLoading(false);
        }
      }}
    >
      <input
        type="password"
        placeholder="New password (min 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
        disabled={isLoading}
        autoComplete="new-password"
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        minLength={8}
        required
        disabled={isLoading}
        autoComplete="new-password"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      <button type="submit" disabled={isLoading} className="disabled:opacity-60">
        {isLoading ? "Updating…" : "Update password"}
      </button>
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
