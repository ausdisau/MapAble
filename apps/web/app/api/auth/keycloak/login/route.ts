import { randomBytes } from "crypto";

import { NextResponse } from "next/server";

import { getKeycloakAuthorizationUrl, isKeycloakEnabled } from "@/lib/auth/keycloak/keycloak-config";
import { setKeycloakOAuthState } from "@/lib/auth/keycloak/keycloak-session-service";

export async function GET(request: Request) {
  if (!isKeycloakEnabled()) {
    return NextResponse.json({ error: "Keycloak disabled" }, { status: 503 });
  }

  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") ?? "/dashboard";
  const state = `${randomBytes(16).toString("hex")}:${Buffer.from(returnTo).toString("base64url")}`;

  await setKeycloakOAuthState(state);

  return NextResponse.redirect(getKeycloakAuthorizationUrl(state));
}
