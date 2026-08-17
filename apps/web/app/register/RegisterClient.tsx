"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthFormCard, AuthOAuthDivider } from "@/components/auth/AuthFormCard";
import { OAuthSignInButtons } from "@/components/auth/OAuthSignInButtons";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import type { OAuthProviderFlags } from "@/lib/auth/oauth-providers";

export default function RegisterClient({
  oauthProviders,
}: {
  oauthProviders: OAuthProviderFlags;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken")?.trim() ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [jurisdiction, setJurisdiction] = useState<"AU" | "NZ">("AU");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const normalizedEmail = normalizeAuthEmail(email);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: password.trim(),
          name,
          jurisdiction,
          ...(inviteToken ? { inviteToken } : {}),
        }),
      });

      const data = (await res.json()) as { error?: string; code?: string };

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      const postRegisterPath = inviteToken
        ? "/worker/onboarding"
        : "/register/support-needs";

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password: password.trim(),
        redirect: false,
        callbackUrl: postRegisterPath,
      });

      if (result?.error) {
        setError(
          "Account created, but sign-in failed. Try signing in on the login page.",
        );
        setIsLoading(false);
        return;
      }

      router.push(postRegisterPath);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <AuthFormCard
      title={inviteToken ? "Create worker account" : "Create your account"}
      description={
        inviteToken
          ? "Complete registration to accept your provider invite and join their roster."
          : "Join MapAble to request care, manage bookings, and connect with providers."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <OAuthSignInButtons
          providers={oauthProviders}
          callbackUrl="/dashboard"
          disabled={isLoading}
        />
        <AuthOAuthDivider label="or register with email" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AccessibleFormField id="register-name" label="Name" required>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
            className={formInputClass}
          />
        </AccessibleFormField>

        <AccessibleFormField id="register-email" label="Email" required>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className={formInputClass}
          />
        </AccessibleFormField>

        <AccessibleFormField
          id="register-password"
          label="Password"
          required
          hint="At least 8 characters."
        >
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            disabled={isLoading}
            className={formInputClass}
          />
        </AccessibleFormField>

        <AccessibleFormField
          id="register-jurisdiction"
          label="Country / region"
          required
          hint="Select where you primarily use disability supports. Australia uses NDIS framing; New Zealand uses Whaikaha / Total Mobility framing."
        >
          <select
            id="register-jurisdiction"
            className={formInputClass}
            value={jurisdiction}
            onChange={(e) =>
              setJurisdiction(e.target.value === "NZ" ? "NZ" : "AU")
            }
            required
            disabled={isLoading}
          >
            <option value="AU">Australia (NDIS)</option>
            <option value="NZ">New Zealand (Whaikaha / Total Mobility)</option>
          </select>
        </AccessibleFormField>

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={isLoading}
          loading={isLoading}
        >
          {isLoading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthFormCard>
  );
}
