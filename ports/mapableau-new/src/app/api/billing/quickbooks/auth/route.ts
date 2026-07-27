/**
 * GET  /api/billing/quickbooks/auth     — initiate QB OAuth 2.0 connect
 * GET  /api/billing/quickbooks/callback — OAuth callback
 * DELETE /api/billing/quickbooks/auth   — disconnect QB
 *
 * Ported from REPL QB auth routes.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  getQbAuthUrl,
  exchangeQbCode,
  qbEnabled,
} from "@/lib/billing/quickbooks/client";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!qbEnabled()) return NextResponse.json({ error: "QB not configured" }, { status: 503 });

  // Handle OAuth callback
  const code = req.nextUrl.searchParams.get("code");
  const realmId = req.nextUrl.searchParams.get("realmId");
  if (code && realmId) {
    const tokens = await exchangeQbCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        qbAccessToken: tokens.access_token,
        qbRefreshToken: tokens.refresh_token,
        qbRealmId: realmId,
        qbTokenExpiresAt: expiresAt,
      },
    });
    return NextResponse.redirect(new URL("/settings?qb=connected", req.url));
  }

  // Initiate OAuth
  const state = randomBytes(16).toString("hex");
  const authUrl = getQbAuthUrl(state);
  return NextResponse.redirect(authUrl);
}

export async function DELETE(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      qbAccessToken: null,
      qbRefreshToken: null,
      qbRealmId: null,
      qbTokenExpiresAt: null,
    },
  });
  return NextResponse.json({ disconnected: true });
}
