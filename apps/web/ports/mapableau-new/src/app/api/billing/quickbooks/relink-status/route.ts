/**
 * GET /api/billing/quickbooks/relink-status
 *
 * Returns whether the current user's QuickBooks connection needs to be
 * re-linked. Used by the QbRelinkBanner component on the settings page.
 *
 * Response:
 *   { connected: false }                          — never connected
 *   { connected: true, needsRelink: false, ... }  — healthy connection
 *   { connected: true, needsRelink: true,  ... }  — token expired / will expire soon
 *
 * The "needs relink" threshold is 7 days before token expiry so the banner
 * appears while the operator still has time to act.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/** How many days before token expiry to start showing the re-link banner. */
const WARN_DAYS_BEFORE_EXPIRY = 7;

export interface QbRelinkStatusResponse {
  connected: boolean;
  needsRelink: boolean;
  /** ISO timestamp of token expiry, or null if not available. */
  expiresAt: string | null;
  /** Number of days until expiry (negative = already expired). */
  daysUntilExpiry: number | null;
  /** The new auth URL to direct the user to. */
  relinkUrl: string;
}

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      qbAccessToken: true,
      qbRefreshToken: true,
      qbRealmId: true,
      qbTokenExpiresAt: true,
    },
  });

  const relinkUrl = "/api/billing/quickbooks/auth";

  if (!user?.qbRealmId || !user.qbAccessToken) {
    return NextResponse.json<QbRelinkStatusResponse>({
      connected: false,
      needsRelink: false,
      expiresAt: null,
      daysUntilExpiry: null,
      relinkUrl,
    });
  }

  const expiresAt = user.qbTokenExpiresAt;
  let daysUntilExpiry: number | null = null;
  let needsRelink = false;

  if (expiresAt) {
    const msUntilExpiry = expiresAt.getTime() - Date.now();
    daysUntilExpiry = Math.floor(msUntilExpiry / (1000 * 60 * 60 * 24));
    needsRelink = daysUntilExpiry <= WARN_DAYS_BEFORE_EXPIRY;
  } else {
    // Token present but no expiry recorded — assume it needs re-linking
    // (this is the state for tokens migrated from the old REPL)
    needsRelink = true;
  }

  return NextResponse.json<QbRelinkStatusResponse>({
    connected: true,
    needsRelink,
    expiresAt: expiresAt?.toISOString() ?? null,
    daysUntilExpiry,
    relinkUrl,
  });
}
