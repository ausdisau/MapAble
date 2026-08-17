import { getKeycloakConfig } from "@/lib/auth/keycloak/keycloak-config";

export async function exchangeKeycloakCode(code: string) {
  const c = getKeycloakConfig();
  const tokenUrl = `${c.baseUrl}/realms/${c.realm}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: c.clientId,
    client_secret: c.clientSecret,
    redirect_uri: c.redirectUri,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error("Keycloak token exchange failed");
  }

  return res.json() as Promise<{
    access_token: string;
    id_token?: string;
    refresh_token?: string;
  }>;
}

export async function fetchKeycloakUserInfo(accessToken: string) {
  const c = getKeycloakConfig();
  const res = await fetch(
    `${c.baseUrl}/realms/${c.realm}/protocol/openid-connect/userinfo`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error("Failed to fetch Keycloak userinfo");
  return res.json() as Promise<{
    sub: string;
    email?: string;
    preferred_username?: string;
    name?: string;
  }>;
}
