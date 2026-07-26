import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  isPeerPeersHostname,
  isPeerPeersPublicPath,
  PEER_PEERS_REQUEST_HEADER,
} from "@/lib/community/mapable-peers/peer-host";

const AUTH_PREFIXES = [
  "/dashboard",
  "/provider",
  "/worker",
  "/driver",
  "/messages",
  "/practitioner",
] as const;

/** Marketplace shop is auth-gated; /marketplace explainer is public. */
const AUTH_MARKETPLACE_PREFIXES = [
  "/marketplace/browse",
  "/marketplace/cart",
  "/marketplace/products",
] as const;

const AUTH_PATHS = ["/care/", "/transport/"] as const;

export function shouldRunAuthMiddleware(pathname: string): boolean {
  return (
    AUTH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) ||
    AUTH_MARKETPLACE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) ||
    AUTH_PATHS.some((path) => pathname.startsWith(path))
  );
}

function skipPeerMiddleware(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

/** Host-based rewrites and canonical URLs for peer.mapable.com.au. */
export function handlePeerPeersHost(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host") ?? "";
  if (!isPeerPeersHostname(host)) return null;

  const { pathname } = request.nextUrl;
  if (skipPeerMiddleware(pathname)) return null;

  if (pathname === "/peers" || pathname.startsWith("/peers/")) {
    const stripped =
      pathname === "/peers" ? "/" : pathname.slice("/peers".length);
    return NextResponse.redirect(new URL(stripped || "/", request.url));
  }

  if (pathname === "/square" || pathname.startsWith("/square/")) {
    const stripped =
      pathname === "/square" ? "/" : pathname.slice("/square".length);
    return NextResponse.redirect(new URL(stripped || "/", request.url));
  }

  if (!isPeerPeersPublicPath(pathname)) {
    return NextResponse.next();
  }

  const internal = pathname === "/" ? "/peers" : `/peers${pathname}`;
  const url = request.nextUrl.clone();
  url.pathname = internal;
  const response = NextResponse.rewrite(url);
  response.headers.set(PEER_PEERS_REQUEST_HEADER, "1");
  return response;
}

/** Redirect legacy /square URLs on the main app host. */
export function redirectLegacySquarePath(
  request: NextRequest,
): NextResponse | null {
  if (isPeerPeersHostname(request.headers.get("host") ?? "")) return null;

  const { pathname } = request.nextUrl;
  if (pathname !== "/square" && !pathname.startsWith("/square/")) return null;

  const rest = pathname === "/square" ? "" : pathname.slice("/square".length);
  return NextResponse.redirect(new URL(`/peers${rest}`, request.url), 308);
}
