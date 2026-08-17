import { isKeycloakEnabled } from "@/lib/auth/keycloak/keycloak-config";

export async function getKeycloakAdminStatus() {
  return {
    enabled: isKeycloakEnabled(),
    message: isKeycloakEnabled()
      ? "Keycloak OIDC bridge active"
      : "Set KEYCLOAK_ENABLED=true to enable",
  };
}
