import { NextResponse } from "next/server";

import {
  exchangeKeycloakCode,
  fetchKeycloakUserInfo,
} from "@/lib/auth/keycloak/keycloak-client";
import {
  createPendingIdentityLink,
  findPendingEmailCollision,
  linkKeycloakIdentity,
} from "@/lib/auth/keycloak/keycloak-profile-bridge";
import { canAutoApproveRole, suggestRoleFromKeycloakGroup } from "@/lib/auth/keycloak/keycloak-role-mapper";
import {
  consumeKeycloakOAuthState,
  isSafeRedirect,
} from "@/lib/auth/keycloak/keycloak-session-service";
import { auditIntegrationAction } from "@/lib/integrations/integration-audit-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect("/login?error=keycloak_missing_params");
  }

  const valid = await consumeKeycloakOAuthState(state);
  if (!valid) {
    return NextResponse.redirect("/login?error=keycloak_invalid_state");
  }

  const returnEncoded = state.split(":")[1];
  const returnTo = returnEncoded
    ? Buffer.from(returnEncoded, "base64url").toString("utf8")
    : "/dashboard";
  if (!isSafeRedirect(returnTo)) {
    return NextResponse.redirect("/login?error=unsafe_redirect");
  }

  const tokens = await exchangeKeycloakCode(code);
  const profile = await fetchKeycloakUserInfo(tokens.access_token);
  const email = profile.email?.toLowerCase();

  if (!email) {
    return NextResponse.redirect("/login?error=keycloak_no_email");
  }

  const collision = await findPendingEmailCollision(email);
  if (collision.existingUser && collision.pending) {
    await createPendingIdentityLink({
      externalId: profile.sub,
      email,
    });
    return NextResponse.redirect("/login?link=pending");
  }

  const user = collision.existingUser;
  if (!user) {
    return NextResponse.redirect(
      `/login?error=no_account&hint=Register first then link Keycloak`
    );
  }

  await linkKeycloakIdentity({
    userId: user.id,
    externalSubjectId: profile.sub,
    email,
  });

  const groups = (profile as { groups?: string[] }).groups ?? [];
  for (const g of groups) {
    const suggestion = await suggestRoleFromKeycloakGroup(g);
    if (suggestion && !canAutoApproveRole(suggestion.suggestedRole)) {
      await prisma.authBridgeEvent.create({
        data: {
          userId: user.id,
          eventType: "role_suggestion_pending",
          provider: "keycloak",
          metadataJson: suggestion,
        },
      });
    }
  }

  await auditIntegrationAction({
    integrationKey: "keycloak",
    action: "login_callback",
    actorUserId: user.id,
    metadata: { email },
  });

  return NextResponse.redirect(returnTo);
}
