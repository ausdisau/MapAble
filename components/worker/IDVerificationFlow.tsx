"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  IDENTITY_VERIFICATION_STEPS,
  type IdentityVerificationStatusView,
} from "@/lib/workers/identity-verification-shared";

function statusLabel(status: string): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "pending_review":
      return "Pending review";
    case "rejected":
      return "Rejected — contact your provider";
    case "expired":
      return "Expired — please verify again";
    case "not_provided":
      return "Not started";
    default:
      return status;
  }
}

export function IDVerificationFlow() {
  const [status, setStatus] = useState<IdentityVerificationStatusView | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/workers/me/identity-verification");
    const data = (await res.json()) as {
      status?: IdentityVerificationStatusView;
      error?: string;
    };
    if (!res.ok) {
      setError(data.error ?? "Could not load verification status");
      setStatus(null);
      setLoading(false);
      return;
    }
    setStatus(data.status ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStart() {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/workers/me/identity-verification", {
      method: "POST",
    });
    const data = (await res.json()) as {
      status?: IdentityVerificationStatusView;
      message?: string;
      error?: string;
    };
    if (!res.ok) {
      setError(data.error ?? "Could not start verification");
      setSubmitting(false);
      return;
    }
    if (data.status) setStatus(data.status);
    setMessage(data.message ?? "Verification started.");
    setSubmitting(false);
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading verification status…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section
        className="rounded-2xl border border-[#005B7F]/15 bg-[#F6FBFC] p-6 shadow-sm"
        aria-labelledby="id-verification-heading"
      >
        <h1
          id="id-verification-heading"
          className="mapable-display text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl"
        >
          Participant-safe ID verification
        </h1>
        <p className="mapable-soft mt-2 text-sm text-slate-600 sm:text-base">
          Complete identity checks before support work. MapAble stores the
          verification outcome and audit trail — not your ID document images.
        </p>

        {status ? (
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Identity status
              </dt>
              <dd className="mt-1 text-sm font-black text-[#005B7F]">
                {statusLabel(status.verificationStatus)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Worker screening
              </dt>
              <dd className="mt-1 text-sm font-black text-[#005B7F]">
                {statusLabel(status.workerScreeningStatus)}
              </dd>
            </div>
          </dl>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="mt-4 text-sm font-medium text-[#00A979]">
            {message}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {status?.verificationStatus === "verified" ? (
            <p className="inline-flex items-center rounded-full border border-[#00A979]/30 bg-[#00A979]/10 px-3 py-1.5 text-sm font-black text-[#0f5132]">
              Verified badge active on your profile
            </p>
          ) : (
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={() => void handleStart()}
              disabled={submitting || !status?.canStart}
            >
              {submitting ? "Starting…" : "Start ID verification"}
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={() => void load()}
          >
            Refresh status
          </Button>
          <Link
            href="/worker/onboarding"
            className="inline-flex items-center text-sm font-bold text-[#005B7F] underline-offset-4 hover:underline"
          >
            Back to onboarding
          </Link>
        </div>

        {!status?.stripeIdentityConfigured ? (
          <p className="mt-4 text-xs text-slate-500">
            Live third-party ID capture (Stripe Identity / IDVerse) is not
            configured in this environment. Starting verification queues a
            MapAble admin review and writes an audit event.
          </p>
        ) : null}
      </section>

      <ol className="space-y-3" aria-label="Verification flow steps">
        {IDENTITY_VERIFICATION_STEPS.map((step, idx) => (
          <li
            key={step}
            className="flex items-start gap-3 rounded-xl border-l-4 border-[#005B7F] bg-[#F6FBFC] p-4"
          >
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#005B7F] text-sm font-black text-white"
              aria-hidden
            >
              {idx + 1}
            </span>
            <p className="mapable-soft pt-1 text-sm font-medium text-[#0C1833] sm:text-base">
              {step}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
