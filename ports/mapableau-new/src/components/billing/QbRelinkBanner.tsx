"use client";

/**
 * QbRelinkBanner
 *
 * Displays a prominent warning banner on the settings page when the current
 * user's QuickBooks Online connection needs to be re-linked.
 *
 * Reasons a re-link is needed:
 *   1. Token has expired (or will expire within 7 days)
 *   2. Token was migrated from the old REPL platform and has no expiry recorded
 *
 * Usage — add to src/app/(dashboard)/settings/page.tsx (or the billing tab):
 *
 *   import { QbRelinkBanner } from "@/components/billing/QbRelinkBanner";
 *
 *   // Inside the page or billing section component:
 *   <QbRelinkBanner />
 *
 * The component fetches its own data client-side so it can be dropped into any
 * server-rendered page without props drilling.
 */

import { useEffect, useState } from "react";

interface RelinkStatus {
  connected: boolean;
  needsRelink: boolean;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  relinkUrl: string;
}

type BannerVariant = "error" | "warning";

interface BannerConfig {
  variant: BannerVariant;
  heading: string;
  body: string;
  ctaLabel: string;
}

function buildBannerConfig(status: RelinkStatus): BannerConfig {
  const days = status.daysUntilExpiry;

  if (days === null || days < 0) {
    return {
      variant: "error",
      heading: "QuickBooks connection expired — re-link required",
      body:
        "Your QuickBooks authorisation has expired. Invoice sync is paused until you re-link. " +
        "No data has been lost — sync will resume automatically once you reconnect.",
      ctaLabel: "Re-link QuickBooks now",
    };
  }

  if (days === 0) {
    return {
      variant: "error",
      heading: "QuickBooks connection expires today — re-link required",
      body:
        "Your QuickBooks authorisation expires today. Re-link now to avoid an interruption to invoice sync.",
      ctaLabel: "Re-link QuickBooks now",
    };
  }

  return {
    variant: "warning",
    heading: `QuickBooks connection expires in ${days} day${days === 1 ? "" : "s"}`,
    body:
      `Your QuickBooks authorisation will expire on ${
        status.expiresAt
          ? new Date(status.expiresAt).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "soon"
      }. Re-link now to keep invoice sync running without interruption.`,
    ctaLabel: "Re-link QuickBooks",
  };
}

// ---------------------------------------------------------------------------
// Colour tokens — adjust to match mapableau-new's design system
// ---------------------------------------------------------------------------

const STYLES: Record<
  BannerVariant,
  { wrapper: string; icon: string; heading: string; cta: string }
> = {
  error: {
    wrapper:
      "flex items-start gap-4 rounded-lg border border-red-200 bg-red-50 p-4",
    icon: "text-red-500",
    heading: "font-semibold text-red-900",
    cta: "inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600",
  },
  warning: {
    wrapper:
      "flex items-start gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4",
    icon: "text-amber-500",
    heading: "font-semibold text-amber-900",
    cta: "inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600",
  },
};

// ---------------------------------------------------------------------------
// Icons (inline SVG — no icon library dependency)
// ---------------------------------------------------------------------------

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`h-6 w-6 flex-shrink-0 ${className ?? ""}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QbRelinkBanner() {
  const [status, setStatus] = useState<RelinkStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/billing/quickbooks/relink-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: RelinkStatus | null) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Don't render anything while loading or if the connection is healthy
  if (loading || !status?.connected || !status.needsRelink) return null;

  const config = buildBannerConfig(status);
  const styles = STYLES[config.variant];

  return (
    <div className={styles.wrapper} role="alert">
      <AlertIcon className={styles.icon} />

      <div className="flex-1 space-y-2">
        <p className={styles.heading}>{config.heading}</p>
        <p className="text-sm text-gray-700">{config.body}</p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a href={status.relinkUrl} className={styles.cta}>
            {config.ctaLabel}
          </a>
          <a
            href="/api/billing/quickbooks/relink-status"
            className="text-sm text-gray-500 underline hover:text-gray-700"
            onClick={(e) => {
              // Soft refresh: re-fetch status without a full page reload
              e.preventDefault();
              setLoading(true);
              fetch("/api/billing/quickbooks/relink-status")
                .then((r) => r.json())
                .then(setStatus)
                .finally(() => setLoading(false));
            }}
          >
            Check status
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Server component wrapper for use in RSC pages
// ---------------------------------------------------------------------------

/**
 * QbRelinkBannerServer
 *
 * Server-side data fetch version for React Server Components.
 * Reads the session and DB directly — no client-side fetch needed.
 *
 * Usage in a server page:
 *   import { QbRelinkBannerServer } from "@/components/billing/QbRelinkBanner";
 *   <QbRelinkBannerServer />
 *
 * Requires: @/auth, @/lib/db to be importable server-side.
 */
export async function QbRelinkBannerServer() {
  // Dynamic import keeps this file usable as a pure client component
  // in environments where server imports are not available.
  const { auth } = await import("@/auth");
  const { prisma } = await import("@/lib/db");

  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      qbAccessToken: true,
      qbRealmId: true,
      qbTokenExpiresAt: true,
    },
  });

  if (!user?.qbRealmId || !user.qbAccessToken) return null;

  const WARN_DAYS = 7;
  let needsRelink = false;
  let daysUntilExpiry: number | null = null;

  if (user.qbTokenExpiresAt) {
    daysUntilExpiry = Math.floor(
      (user.qbTokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    needsRelink = daysUntilExpiry <= WARN_DAYS;
  } else {
    // Migrated token — no expiry on record
    needsRelink = true;
  }

  if (!needsRelink) return null;

  const syntheticStatus: RelinkStatus = {
    connected: true,
    needsRelink: true,
    expiresAt: user.qbTokenExpiresAt?.toISOString() ?? null,
    daysUntilExpiry,
    relinkUrl: "/api/billing/quickbooks/auth",
  };

  const config = buildBannerConfig(syntheticStatus);
  const styles = STYLES[config.variant];

  return (
    <div className={styles.wrapper} role="alert">
      <AlertIcon className={styles.icon} />
      <div className="flex-1 space-y-2">
        <p className={styles.heading}>{config.heading}</p>
        <p className="text-sm text-gray-700">{config.body}</p>
        <div className="pt-1">
          <a href={syntheticStatus.relinkUrl} className={styles.cta}>
            {config.ctaLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
