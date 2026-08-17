"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { normalizeAuthEmail, redirectAfterAuth, safeAuthCallbackPath } from "@/lib/auth/auth-flow";
import type { OAuthProviderFlags } from "@/lib/auth/oauth-providers";
import { clientAgentLog } from "@/lib/debug/client-agent-log";

function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case "OAuthSignin":
    case "OAuthCallback":
      return "Social sign-in failed. Please try again.";
    case "OAuthAccountNotLinked":
      return "This email is already registered with a different sign-in method. Use email and password, or contact support.";
    case "AccessDenied":
      return "Sign-in was cancelled or denied.";
    default:
      return "Could not sign in. Please try again.";
  }
}

export default function LoginClient({
  oauthProviders,
}: {
  oauthProviders: OAuthProviderFlags;
}) {
  const searchParams = useSearchParams();
  const callbackUrl = safeAuthCallbackPath(
    searchParams.get("callbackUrl"),
    "/dashboard",
  );
  const resetSuccess = searchParams.get("reset") === "success";
  const oauthError = oauthErrorMessage(searchParams.get("error"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorPhoneHint, setTwoFactorPhoneHint] = useState("");
  const [passkeyEmail, setPasskeyEmail] = useState("");
  const [authMode, setAuthMode] = useState<"password" | "passkey">("password");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isTwoFactorStep = Boolean(twoFactorToken);
  const isPasskeyMode = authMode === "passkey";

  async function handlePasskeyLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const optionsResponse = await fetch("/api/passkeys/login/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizeAuthEmail(passkeyEmail) }),
      });
      const optionsData = (await optionsResponse.json()) as {
        challengeToken?: string;
        error?: string;
        options?: Parameters<typeof startAuthentication>[0];
      };

      if (
        !optionsResponse.ok ||
        !optionsData.options ||
        !optionsData.challengeToken
      ) {
        setError(optionsData.error || "Could not start passkey sign-in.");
        setIsLoading(false);
        return;
      }

      const credential = await startAuthentication(optionsData.options);
      const verifyResponse = await fetch("/api/passkeys/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken: optionsData.challengeToken,
          credential,
        }),
      });
      const verifyData = (await verifyResponse.json()) as {
        error?: string;
        signInToken?: string;
      };

      if (!verifyResponse.ok || !verifyData.signInToken) {
        setError(verifyData.error || "Passkey sign-in failed.");
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        passkeyToken: verifyData.signInToken,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Could not complete passkey sign-in. Please try again.");
        setIsLoading(false);
        return;
      }

      redirectAfterAuth(callbackUrl);
    } catch {
      setError("Passkey sign-in was cancelled or failed.");
      setIsLoading(false);
    }
  }

  return (
    <AuthFormCard
      title="Welcome back"
      description="Sign in to your dashboard, bookings, and messages."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <OAuthSignInButtons
          providers={oauthProviders}
          callbackUrl={callbackUrl}
          disabled={isLoading}
          labelMode="login"
        />
        <AuthOAuthDivider label="or sign in with email" />
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          onClick={() => {
            setAuthMode(isPasskeyMode ? "password" : "passkey");
            setError("");
            setTwoFactorToken("");
          }}
        >
          {isPasskeyMode ? "Use email and password" : "Login with passkey"}
        </button>
      </div>

      {oauthError ? <AuthAlert variant="error">{oauthError}</AuthAlert> : null}

      {isPasskeyMode ? (
        <form className="flex flex-col gap-4" onSubmit={handlePasskeyLogin}>
          <AccessibleFormField id="passkey-email" label="Email" required>
            <input
              id="passkey-email"
              name="email"
              type="email"
              autoComplete="email webauthn"
              value={passkeyEmail}
              onChange={(e) => setPasskeyEmail(e.target.value)}
              required
              disabled={isLoading}
              className={formInputClass}
            />
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
            {isLoading ? "Checking passkey…" : "Continue with passkey"}
          </Button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setIsLoading(true);

            try {
              if (isTwoFactorStep) {
                const verifyResponse = await fetch(
                  "/api/auth/twilio-2fa/verify",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      challengeToken: twoFactorToken,
                      code: twoFactorCode,
                    }),
                  },
                );

                const verifyData = (await verifyResponse.json()) as {
                  error?: string;
                  twoFactorToken?: string;
                };

                if (!verifyResponse.ok || !verifyData.twoFactorToken) {
                  setError(verifyData.error || "Invalid verification code");
                  setIsLoading(false);
                  return;
                }

                const result = await signIn("credentials", {
                  twoFactorToken: verifyData.twoFactorToken,
                  redirect: false,
                  callbackUrl,
                });

                if (result?.error) {
                  setError("Could not complete sign-in. Please try again.");
                  setIsLoading(false);
                  return;
                }

                redirectAfterAuth(callbackUrl);
                return;
              }

              const twoFactorResponse = await fetch(
                "/api/auth/twilio-2fa/start",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: normalizeAuthEmail(email),
                    password: password.trim(),
                  }),
                },
              );

              const twoFactorData = (await twoFactorResponse.json()) as {
                challengeToken?: string;
                error?: string;
                phoneHint?: string;
                required?: boolean;
              };

              if (!twoFactorResponse.ok) {
                setError(
                  twoFactorData.error ||
                    "Could not start two-factor authentication.",
                );
                setIsLoading(false);
                return;
              }

              if (twoFactorData.required) {
                if (!twoFactorData.challengeToken) {
                  setError("Could not start two-factor authentication.");
                  setIsLoading(false);
                  return;
                }
                setTwoFactorToken(twoFactorData.challengeToken);
                setTwoFactorPhoneHint(twoFactorData.phoneHint ?? "your phone");
                setTwoFactorCode("");
                setIsLoading(false);
                return;
              }

              const result = await signIn("credentials", {
                email: normalizeAuthEmail(email),
                password: password.trim(),
                redirect: false,
                callbackUrl,
              });

              clientAgentLog(
                "C",
                "LoginClient.tsx:signInResult",
                "signIn returned",
                {
                  ok: result?.ok ?? null,
                  error: result?.error ?? null,
                  status: result?.status ?? null,
                  callbackUrl,
                },
              );

              if (result?.error) {
                setError("Invalid email or password");
                setIsLoading(false);
                return;
              }

              if (result?.ok === true) {
                setIsLoading(false);
                redirectAfterAuth(callbackUrl);
                return;
              }

              setError("An unexpected error occurred. Please try again.");
              setIsLoading(false);
            } catch {
              setError("An error occurred. Please try again.");
              setIsLoading(false);
            }
          }}
        >
          {isTwoFactorStep ? (
            <AccessibleFormField
              id="login-two-factor-code"
              label="Verification code"
              hint={`Enter the code sent to ${twoFactorPhoneHint}.`}
              required
            >
              <input
                id="login-two-factor-code"
                name="twoFactorCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                required
                disabled={isLoading}
                className={formInputClass}
              />
            </AccessibleFormField>
          ) : (
            <>
              <AccessibleFormField id="login-email" label="Email" required>
                <input
                  id="login-email"
                  name="email"
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
                id="login-password"
                label="Password"
                required
              >
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={formInputClass}
                />
              </AccessibleFormField>
            </>
          )}

          {resetSuccess ? (
            <AuthAlert variant="success">
              Your password was updated. Sign in with your new password.
            </AuthAlert>
          ) : null}

          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

          <div className="flex flex-col gap-3 pt-1">
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full"
              disabled={isLoading}
              loading={isLoading}
            >
              {isLoading
                ? "Signing in…"
                : isTwoFactorStep
                  ? "Verify and sign in"
                  : "Sign in"}
            </Button>
            {isTwoFactorStep ? (
              <button
                type="button"
                className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                disabled={isLoading}
                onClick={() => {
                  setTwoFactorToken("");
                  setTwoFactorCode("");
                  setTwoFactorPhoneHint("");
                  setError("");
                }}
              >
                Use a different email
              </button>
            ) : null}
            <p className="text-center text-sm text-muted-foreground">
              <Link
                href="/forgot-password"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </p>
          </div>
        </form>
      )}
    </AuthFormCard>
  );
}
