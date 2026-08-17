import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getUserById } from "@/lib/auth/current-user";
import { createMobileAuthorizationCode } from "@/lib/auth/mobile-token";

const PKCE_CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

function allowedRedirectUris(): Set<string> {
  const configured = process.env.MOBILE_AUTH_REDIRECT_URIS?.trim();
  const values = configured
    ? configured.split(",").map((value) => value.trim()).filter(Boolean)
    : ["mapable://auth/callback"];
  return new Set(values);
}

function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectUri = url.searchParams.get("redirect_uri")?.trim() ?? "";
  const codeChallenge = url.searchParams.get("code_challenge")?.trim() ?? "";
  const codeChallengeMethod = url.searchParams.get("code_challenge_method")?.trim() ?? "";
  const state = url.searchParams.get("state")?.trim() ?? "";

  if (!allowedRedirectUris().has(redirectUri)) {
    return errorResponse("Mobile redirect URI is not allowed");
  }
  if (codeChallengeMethod !== "S256" || !PKCE_CHALLENGE_PATTERN.test(codeChallenge)) {
    return errorResponse("A valid S256 PKCE challenge is required");
  }
  if (state.length < 8 || state.length > 200) {
    return errorResponse("A valid state value is required");
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    const callbackPath = `${url.pathname}${url.search}`;
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("callbackUrl", callbackPath);
    return Response.redirect(loginUrl, 302);
  }

  const user = await getUserById(session.user.id);
  if (!user) return errorResponse("Authenticated account was not found", 401);

  const code = createMobileAuthorizationCode({
    userId: user.id,
    codeChallenge,
    redirectUri,
  });

  const callback = new URL(redirectUri);
  callback.searchParams.set("code", code);
  callback.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: callback.toString(),
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
  });
}
