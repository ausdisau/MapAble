import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { resolveNextAuthSecret } from "@/lib/auth/nextauth-env";
import {
  handlePeerPeersHost,
  redirectLegacySquarePath,
  shouldRunAuthMiddleware,
} from "@/lib/mapable-peers/peer-middleware";
import {
  CSP_ENFORCE_HEADER,
  CSP_NONCE_HEADER,
  createScriptNonce,
  isCspPreviewEnforceEnabled,
} from "@/lib/security/csp-preview-enforce";
import { buildContentSecurityPolicyEnforce } from "@/lib/security/headers";
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

function withCorrelationAndCsp(
  request: NextRequest,
  response: NextResponse,
  nonce: string,
): NextResponse {
  const correlationId = resolveCorrelationId(
    request.headers.get(CORRELATION_ID_HEADER) ??
      request.headers.get(REQUEST_ID_HEADER),
  );
  response.headers.set(CORRELATION_ID_HEADER, correlationId);
  response.headers.set(REQUEST_ID_HEADER, correlationId);

  if (isCspPreviewEnforceEnabled()) {
    response.headers.set(
      CSP_ENFORCE_HEADER,
      buildContentSecurityPolicyEnforce(nonce),
    );
  }

  return response;
}

export default async function middleware(request: NextRequest) {
  const nonce = createScriptNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CSP_NONCE_HEADER, nonce);

  const legacySquare = redirectLegacySquarePath(request);
  if (legacySquare) return withCorrelationAndCsp(request, legacySquare, nonce);

  const peerResponse = handlePeerPeersHost(request);
  if (peerResponse) return withCorrelationAndCsp(request, peerResponse, nonce);

  if (shouldRunAuthMiddleware(request.nextUrl.pathname)) {
    if (!(await hasAuthenticatedSession(request))) {
      if (!resolveNextAuthSecret()) {
        return withCorrelationAndCsp(
          request,
          authMisconfiguredResponse(request),
          nonce,
        );
      }
      return withCorrelationAndCsp(request, redirectToLogin(request), nonce);
    }
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  return withCorrelationAndCsp(request, response, nonce);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|css|js)$).*)",
  ],
};
