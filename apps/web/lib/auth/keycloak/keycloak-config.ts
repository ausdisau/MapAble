export function isKeycloakEnabled(): boolean {
  return process.env.KEYCLOAK_ENABLED === "true";
}

export function getKeycloakConfig() {
  return {
    baseUrl: process.env.KEYCLOAK_BASE_URL ?? "",
    realm: process.env.KEYCLOAK_REALM ?? "",
    clientId: process.env.KEYCLOAK_CLIENT_ID ?? "",
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? "",
    issuerUrl: process.env.KEYCLOAK_ISSUER_URL ?? "",
    redirectUri: process.env.KEYCLOAK_REDIRECT_URI ?? "",
  };
}

export function getKeycloakAuthorizationUrl(state: string): string {
  const c = getKeycloakConfig();
  const params = new URLSearchParams({
    client_id: c.clientId,
    redirect_uri: c.redirectUri,
    response_type: "code",
    scope: "openid profile email",
    state,
  });
  return `${c.baseUrl}/realms/${c.realm}/protocol/openid-connect/auth?${params}`;
}
