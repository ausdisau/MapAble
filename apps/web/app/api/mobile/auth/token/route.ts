import { getUserById } from "@/lib/auth/current-user";
import {
  createMobileAccessToken,
  exchangeMobileAuthorizationCode,
} from "@/lib/auth/mobile-token";

const VERIFIER_PATTERN = /^[A-Za-z0-9._~-]{43,128}$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!body || typeof body !== "object") {
    return Response.json(
      { error: "Invalid token request" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const input = body as Record<string, unknown>;
  const code = typeof input.code === "string" ? input.code.trim() : "";
  const codeVerifier =
    typeof input.codeVerifier === "string" ? input.codeVerifier.trim() : "";
  const redirectUri =
    typeof input.redirectUri === "string" ? input.redirectUri.trim() : "";

  if (!code || !VERIFIER_PATTERN.test(codeVerifier) || !redirectUri) {
    return Response.json(
      { error: "Invalid authorization code exchange" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const exchanged = exchangeMobileAuthorizationCode({
    code,
    codeVerifier,
    redirectUri,
  });
  if (!exchanged) {
    return Response.json(
      { error: "Authorization code is invalid or expired" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const user = await getUserById(exchanged.userId);
  if (!user) {
    return Response.json(
      { error: "Authenticated account was not found" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const token = createMobileAccessToken({
    userId: user.id,
    scopes: ["identity:read", "accessibility:read", "accessibility:write"],
  });

  return Response.json(
    {
      accessToken: token.accessToken,
      tokenType: "Bearer",
      expiresIn: token.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        primaryRole: user.primaryRole,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    },
  );
}
