import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { resolveNextAuthSecret } from "@/lib/auth/nextauth-env";
import {
  handlePeerPeersHost,
  redirectLegacySquarePath,
  shouldRunAuthMiddleware,
} from "@/lib/mapable-peers/peer-middleware";
import {
  CSP_ENFORCE_HEADER,
  createScriptNonce,
  isCspPreviewEnforceEnabled,
} from "@/lib/security/csp-preview-enforce";
import { buildForwardRequestHeaders } from "@/lib/security/forward-request-headers";
import {
  buildContentSecurityPolicyEnforce,
  resolveEmbedFrameAncestors,
} from "@/lib/security/headers";
import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
  resolveCorrelationId,
} from "@/lib/security/request-correlation";

/** Match NextAuth secure cookie naming on HTTPS (Vercel, production). */
function usesSecureSessionCookies(request: NextRequest): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }
  return request.nextUrl.protocol === "https:";
}

async function hasAuthenticatedSession(request: NextRequest): Promise<boolean> {
  const secret = resolveNextAuthSecret();
  if (!secret) return false;

  const token = await getToken({
    req: request,
    secret,
    secureCookie: usesSecureSessionCookies(request),
  });
  if (token) return true;

  // Edge middleware can fail to decrypt JWE session cookies even when the
  // Node.js session route succeeds — confirm via the same endpoint the client uses.
  const cookie = request.headers.get("cookie");
  if (!cookie) return false;

  try {
    const sessionUrl = new URL("/api/auth/session", request.url);
    const response = await fetch(sessionUrl, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!response.ok) return false;
    const session = (await response.json()) as { user?: { id?: string } };
    return Boolean(session.user?.id);
  } catch {
    return false;
  }
}

function authMisconfiguredResponse(request: NextRequest): NextResponse {
  const acceptsHtml = request.headers.get("accept")?.includes("text/html");

  if (acceptsHtml) {
    return new NextResponse(
      "Authentication is temporarily unavailable. Configure NEXTAUTH_SECRET in the deployment environment.",
      {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  }

  return NextResponse.json(
    {
      error: "Authentication is misconfigured",
      code: "AUTH_SECRET_MISSING",
    },
    { status: 503 },
  );
}

function redirectToLogin(request: NextRequest): NextResponse {
  const login = new URL("/login", request.url);
  const callbackPath = request.nextUrl.pathname + request.nextUrl.search;
  login.searchParams.set("callbackUrl", callbackPath);
  return NextResponse.redirect(login);
}

function isEmbedPath(pathname: string): boolean {
  return pathname === "/embed" || pathname.startsWith("/embed/");
}

/**
 * Build the enforcing Content-Security-Policy for this request.
 * Global: frame-ancestors 'none'. Embed routes: env allow-list or `*`.
 */
function buildEnforcePolicyForRequest(
  request: NextRequest,
  nonce: string,
): string {
  if (isEmbedPath(request.nextUrl.pathname)) {
    return buildContentSecurityPolicyEnforce(nonce, {
      frameAncestors: resolveEmbedFrameAncestors(),
    });
  }
  return buildContentSecurityPolicyEnforce(nonce, {
    frameAncestors: "'none'",
  });
}

/**
 * Apply correlation IDs and, when preview CSP enforce is on, the
 * nonce-bearing Content-Security-Policy. Embed routes also clear
 * clickjacking DENY so partners may frame them when frame-ancestors permits.
 *
 * Enforce stays flag-gated (`MAPABLE_CSP_ENFORCE_PREVIEW`) so login/a11y CI
 * and production keep working until layout nonce injection is always-on.
 */
function withCorrelationAndCsp(
  response: NextResponse,
  correlationId: string,
  enforcePolicy: string | null,
  embedRoute: boolean,
): NextResponse {
  response.headers.set(CORRELATION_ID_HEADER, correlationId);
  response.headers.set(REQUEST_ID_HEADER, correlationId);

  if (enforcePolicy) {
    response.headers.set(CSP_ENFORCE_HEADER, enforcePolicy);
  }

  if (embedRoute) {
    // Prefer CSP frame-ancestors for embed; remove legacy DENY if present.
    response.headers.delete("X-Frame-Options");
  } else {
    response.headers.set("X-Frame-Options", "DENY");
  }

  return response;
}

export default async function middleware(request: NextRequest) {
  const nonce = createScriptNonce();
  const enforceEnabled = isCspPreviewEnforceEnabled();
  const enforcePolicy = enforceEnabled
    ? buildEnforcePolicyForRequest(request, nonce)
    : null;
  const embedRoute = isEmbedPath(request.nextUrl.pathname);

  const correlationId = resolveCorrelationId(
    request.headers.get(CORRELATION_ID_HEADER) ??
      request.headers.get(REQUEST_ID_HEADER),
  );

  const requestHeaders = buildForwardRequestHeaders(
    request,
    nonce,
    enforcePolicy,
    correlationId,
  );

  const legacySquare = redirectLegacySquarePath(request);
  if (legacySquare) {
    return withCorrelationAndCsp(
      legacySquare,
      correlationId,
      enforcePolicy,
      embedRoute,
    );
  }

  const peerResponse = handlePeerPeersHost(request);
  if (peerResponse) {
    return withCorrelationAndCsp(
      peerResponse,
      correlationId,
      enforcePolicy,
      embedRoute,
    );
  }

  if (shouldRunAuthMiddleware(request.nextUrl.pathname)) {
    if (!(await hasAuthenticatedSession(request))) {
      if (!resolveNextAuthSecret()) {
        return withCorrelationAndCsp(
          authMisconfiguredResponse(request),
          correlationId,
          enforcePolicy,
          embedRoute,
        );
      }
      return withCorrelationAndCsp(
        redirectToLogin(request),
        correlationId,
        enforcePolicy,
        embedRoute,
      );
    }
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  return withCorrelationAndCsp(
    response,
    correlationId,
    enforcePolicy,
    embedRoute,
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|css|js)$).*)",
  ],
};
