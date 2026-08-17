import { NextResponse } from "next/server";

import { getKeycloakConfig, isKeycloakEnabled } from "@/lib/auth/keycloak/keycloak-config";
import { auditIntegrationAction } from "@/lib/integrations/integration-audit-service";

export async function POST() {
  if (!isKeycloakEnabled()) {
    return NextResponse.json({ ok: true, provider: "disabled" });
  }

  const c = getKeycloakConfig();
  await auditIntegrationAction({
    integrationKey: "keycloak",
    action: "logout",
  });

  const logoutUrl = `${c.baseUrl}/realms/${c.realm}/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL ?? "/")}`;
  return NextResponse.json({ logoutUrl });
}
