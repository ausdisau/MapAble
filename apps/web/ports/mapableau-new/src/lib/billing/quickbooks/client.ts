/**
 * QuickBooks Online OAuth 2.0 client for mapableau-new.
 *
 * Ported from REPL server/quickbooks.ts. Uses standard fetch.
 * Prisma-aware: token refresh writes back through a caller-supplied prisma
 * handle so the module stays import-friendly in both API routes and server
 * actions without introducing circular dependencies.
 *
 * Required environment variables:
 *   QB_CLIENT_ID             — QuickBooks OAuth 2.0 Client ID
 *   QB_CLIENT_SECRET         — QuickBooks OAuth 2.0 Client Secret
 *   QB_REDIRECT_URI          — OAuth callback URI (e.g. https://<domain>/api/quickbooks/callback)
 *
 * Optional:
 *   QB_ENVIRONMENT           — "sandbox" (default) or "production"
 *   QB_WEBHOOK_VERIFIER_TOKEN — HMAC webhook verification token
 */

import crypto from "crypto";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function qbBaseUrl() {
  return (process.env.QB_ENVIRONMENT || "sandbox") === "production"
    ? "https://quickbooks.api.intuit.com"
    : "https://sandbox-quickbooks.api.intuit.com";
}

const QB_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

export function qbEnabled(): boolean {
  return !!(
    process.env.QB_CLIENT_ID &&
    process.env.QB_CLIENT_SECRET &&
    process.env.QB_REDIRECT_URI
  );
}

// ---------------------------------------------------------------------------
// OAuth helpers
// ---------------------------------------------------------------------------

export function getQbAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.QB_CLIENT_ID!,
    redirect_uri: process.env.QB_REDIRECT_URI!,
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting",
    state,
  });
  return `${QB_AUTH_URL}?${params.toString()}`;
}

function qbCredentials(): string {
  return Buffer.from(
    `${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`,
  ).toString("base64");
}

export async function exchangeQbCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
}> {
  const res = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${qbCredentials()}`,
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.QB_REDIRECT_URI!,
    }),
  });
  if (!res.ok) throw new Error(`QuickBooks token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function refreshQbToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${qbCredentials()}`,
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`QuickBooks token refresh failed: ${await res.text()}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// QB user shape (subset of mapableau-new User needed here)
// ---------------------------------------------------------------------------

export interface QbUser {
  id: string;
  fullName: string;
  email: string | null;
  ndisNumber: string | null;
  qbAccessToken: string | null;
  qbRefreshToken: string | null;
  qbRealmId: string | null;
  qbTokenExpiresAt: Date | null;
}

export interface QbTokenPrisma {
  user: {
    update: (args: any) => Promise<any>;
  };
}

/** Returns a fresh access token, refreshing via QB if needed. Updates the DB record. */
export async function getValidQbAccessToken(
  prisma: QbTokenPrisma,
  user: QbUser,
): Promise<{ accessToken: string; realmId: string }> {
  if (!user.qbAccessToken || !user.qbRefreshToken || !user.qbRealmId) {
    throw new Error("QuickBooks not connected");
  }
  const now = new Date();
  const expiry = user.qbTokenExpiresAt ?? new Date(0);
  const bufferMs = 5 * 60 * 1000;
  if (now.getTime() + bufferMs < expiry.getTime()) {
    return { accessToken: user.qbAccessToken, realmId: user.qbRealmId };
  }
  const tokens = await refreshQbToken(user.qbRefreshToken);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      qbAccessToken: tokens.access_token,
      qbRefreshToken: tokens.refresh_token,
      qbTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
  return { accessToken: tokens.access_token, realmId: user.qbRealmId };
}

// ---------------------------------------------------------------------------
// QB API request helper
// ---------------------------------------------------------------------------

interface QbApiResponse {
  [key: string]: unknown;
  QueryResponse?: {
    Customer?: Array<{ Id: string; DisplayName: string }>;
    Payment?: Array<{ TotalAmt: number }>;
  };
  Customer?: { Id: string; DisplayName: string };
  Invoice?: { Id: string; SyncToken: string };
}

export async function qbApiRequest(
  accessToken: string,
  realmId: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<QbApiResponse> {
  const url = `${qbBaseUrl()}/v3/company/${realmId}/${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`QuickBooks API error (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Webhook HMAC verification
// ---------------------------------------------------------------------------

/** Verify a QuickBooks webhook payload signature. Returns true if valid. */
export function verifyQbWebhookSignature(
  rawBody: string,
  signatureHeader: string,
): boolean {
  const token = process.env.QB_WEBHOOK_VERIFIER_TOKEN;
  if (!token) return true; // not configured — accept all (log a warning in prod)
  const expected = crypto
    .createHmac("sha256", token)
    .update(rawBody)
    .digest("base64");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader),
  );
}
